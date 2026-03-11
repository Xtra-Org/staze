import { Router } from 'express'
import { getLanguage } from '../services/language.js'
import { generateDoctorReport, geminiAvailable } from '../services/gemini.js'

const router = Router()

router.post('/', async (request, response) => {
  const { session = {} } = request.body || {}
  const language = getLanguage(session.language)
  const createdAt = new Date().toLocaleString(language.code)
  const sections = [
    language.reportTitle,
    `Generated: ${createdAt}`,
    `Emergency: ${session.emergency || 'Not provided'}`,
    `Severity: ${session.severity || 'Unknown'}`,
    `Condition: ${session.condition || 'Unknown'}`,
    `Completed steps: ${(session.completedSteps || []).join(', ') || 'None logged'}`,
    `CPR summary: ${session.cprSummary || 'Not started'}`,
    `Hospitals: ${(session.hospitals || []).map((item) => item.name).join(', ') || 'Not selected'}`,
    `Timeline: ${(session.timeline || []).map((item) => `${item.time} ${item.summary}`).join(' | ') || 'No timeline entries'}`,
  ]

  const fallbackReport = sections.join('\n')

  if (!geminiAvailable()) {
    return response.json({ report: fallbackReport })
  }

  try {
    const report = await generateDoctorReport(session)
    return response.json({ report: report || fallbackReport })
  } catch (error) {
    console.error('Gemini report failed, serving fallback report:', error.message)
    return response.json({ report: fallbackReport })
  }
})

export default router
