import { Router } from 'express'
import { detectScenario } from '../services/language.js'
import { geminiAvailable, rankHospitalsWithGemini } from '../services/gemini.js'
import { searchHospitalsViaOsm } from '../services/osm.js'

const router = Router()

function scoreHospital(hospital, scenario) {
  const text = `${hospital.name} ${hospital.address}`.toLowerCase()
  let score = 100 - Math.min((hospital.distance || 0) * 8, 40)

  const keywordBoosts = {
    'chest-pain': ['heart', 'cardiac', 'cardio'],
    trauma: ['trauma', 'ortho', 'ortho', 'emergency', 'surgery'],
    fracture: ['trauma', 'ortho', 'bone', 'spine'],
    burn: ['burn', 'plastic', 'skin'],
    seizure: ['neuro', 'brain', 'stroke'],
    unconscious: ['critical', 'emergency', 'multi'],
    general: ['emergency', 'general'],
  }

  for (const keyword of keywordBoosts[scenario] || keywordBoosts.general) {
    if (text.includes(keyword)) score += 18
  }

  return score
}

function reasonForHospital(hospital, scenario, language) {
  const templates = {
    en: scenario === 'chest-pain'
      ? 'Ranked for proximity and possible cardiac relevance.'
      : 'Ranked for proximity and emergency suitability.',
    hi: scenario === 'chest-pain'
      ? 'निकटता और संभावित कार्डियक उपयुक्तता के आधार पर रैंक किया गया।'
      : 'निकटता और आपातकालीन उपयुक्तता के आधार पर रैंक किया गया।',
    bn: scenario === 'chest-pain'
      ? 'নিকটতা ও সম্ভাব্য কার্ডিয়াক উপযোগিতার ভিত্তিতে র‌্যাঙ্ক করা হয়েছে।'
      : 'নিকটতা ও জরুরি উপযোগিতার ভিত্তিতে র‌্যাঙ্ক করা হয়েছে।',
  }

  return templates[language] || templates.en
}

router.post('/', async (request, response, next) => {
  try {
    const { lat, lng, emergency = '', language = 'en' } = request.body || {}

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return response.status(400).json({ error: 'lat and lng are required numeric values' })
    }

    const scenario = detectScenario(emergency)
    let hospitals = []

    try {
      hospitals = await searchHospitalsViaOsm({ lat, lng })
    } catch (error) {
      console.error('OSM hospital lookup failed:', error.message)
      return response.json([])
    }

    // Limit to closest 8 hospitals, then apply heuristics mapping
    const ranked = hospitals
      .map((hospital) => ({
        ...hospital,
        specialty_match: scenario.replace('-', ' '),
        rank_reason: reasonForHospital(hospital, scenario, language),
        score: scoreHospital(hospital, scenario),
      }))
      .sort((left, right) => right.score - left.score || left.distance - right.distance)
      .slice(0, 8)
      .map(({ score, ...hospital }) => hospital)

    if (geminiAvailable() && ranked.length > 0) {
      try {
        const geminiRanking = await rankHospitalsWithGemini({
          emergency,
          hospitals: ranked,
          language,
        })

        if (geminiRanking.length > 0) {
          const rankingMap = new Map(geminiRanking.map((item, index) => [item.name.toLowerCase(), { ...item, order: index }]))

          return response.json(
            ranked
              .map((hospital, index) => {
                const match = rankingMap.get(hospital.name.toLowerCase())
                return {
                  ...hospital,
                  specialty_match: match?.specialty_match || hospital.specialty_match,
                  rank_reason: match?.rank_reason || hospital.rank_reason,
                  order: match?.order ?? index,
                }
              })
              .sort((left, right) => left.order - right.order)
              .map(({ order, ...hospital }) => hospital),
          )
        }
      } catch (error) {
        console.error('Gemini hospital ranking failed, serving heuristic order:', error.message)
      }
    }

    return response.json(ranked)
  } catch (error) {
    return next(error)
  }
})

export default router
