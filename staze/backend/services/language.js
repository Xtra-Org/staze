export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en-IN',
    name: 'English',
    cprBeat: 'Press',
    cprBreath: 'Stop — give two rescue breaths',
    warningCall: 'Call 108 immediately if the person becomes less responsive.',
    reportTitle: 'Emergency Stabilization Summary',
    stepComplete: 'Step complete. Move to the next step.',
  },
  hi: {
    code: 'hi-IN',
    name: 'Hindi',
    cprBeat: 'दबाएं',
    cprBreath: 'रुकें — दो सांसें दें',
    warningCall: 'यदि व्यक्ति की प्रतिक्रिया कम हो जाए तो तुरंत 108 पर कॉल करें।',
    reportTitle: 'आपातकाल स्थिरीकरण सारांश',
    stepComplete: 'चरण पूरा हुआ। अगले चरण पर जाएं।',
  },
  bn: {
    code: 'bn-IN',
    name: 'Bengali',
    cprBeat: 'চাপুন',
    cprBreath: 'থামুন — দুটি শ্বাস দিন',
    warningCall: 'রোগীর সাড়া কমে গেলে সঙ্গে সঙ্গে 108 নম্বরে ফোন করুন।',
    reportTitle: 'জরুরি স্থিতিশীলকরণ সারাংশ',
    stepComplete: 'ধাপ সম্পন্ন। পরের ধাপে যান।',
  },
}

export function getLanguage(language = 'en') {
  return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en
}

export function normalizeEmergency(emergency = '') {
  return emergency.trim().toLowerCase()
}

export function detectScenario(emergency = '') {
  const text = normalizeEmergency(emergency)
  const hasChestPain = /chest pain|pain in (the )?chest|chest pressure|chest tightness|heart attack|cardiac|clutching (his|her|the) chest|crushing chest/.test(text)
  const hasBleeding = /bleed|bleeding|blood|hemorrhag|haemorrhag|cut|wound|gash|lacerat|deep cut|severe cut/.test(text)
  const hasTraumaImpact = /hit by|run over|road accident|road crash|vehicle|bike accident|bicycle accident|car accident|crash|collision|struck by|major trauma|trauma|fell in front|feel in front|fall in front|fall from|fell from|dragged|thrown/.test(text)
  const hasSevereTissueDamage = /legs torn|leg torn|torn up|ripped open|mangled|amputat|deglov|crushed|shredded|limb hanging/.test(text)
  const hasFallInjury = /fell|feel|fall|slipped|trip|tripped|stumbled/.test(text)
  const hasLimbInjury = /legs injured|leg injured|injured legs|injured leg|injured arm|hurt leg|hurt his leg|hurt her leg|hurt the leg|hurt both legs|cannot walk|can't walk|unable to walk|cannot stand|can't stand|unable to stand|limping|limb injury/.test(text)
  const hasFractureSignals = /fracture|broken|bone|dislocat|twisted ankle|sprain|fell and hurt|fell on|fall and (his|her|the) leg|injured leg|injured arm/.test(text)

  if (hasChestPain) return 'chest-pain'
  if (hasTraumaImpact || (hasSevereTissueDamage && (hasBleeding || hasFractureSignals || /leg|arm|head|neck|back|spine/.test(text)))) return 'trauma'
  if (hasFallInjury && (hasLimbInjury || hasFractureSignals)) return 'fracture'
  if (hasBleeding || hasSevereTissueDamage) return 'bleeding'
  if (/burn|fire|scald/.test(text)) return 'burn'
  if (/seizure|fit|convulsion/.test(text)) return 'seizure'
  if (/chok|not breathing|airway/.test(text)) return 'choking'
  if (hasFractureSignals) return 'fracture'
  if (/unconscious|not waking|collapsed/.test(text)) return 'unconscious'
  if (/drown|water/.test(text)) return 'drowning'
  return 'general'
}

export function formatMinutesSeconds(totalSeconds = 0) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}
