import { detectScenario, getLanguage } from './language.js'

const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function getApiKey() {
  return process.env.GEMINI_API_KEY?.trim()
}

function extractJson(text) {
  if (!text) {
    throw new Error('Gemini returned empty content')
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')

  const candidates = [firstBrace, firstBracket].filter((value) => value >= 0)
  const startIndex = Math.min(...candidates)

  if (!Number.isFinite(startIndex)) {
    throw new Error('Gemini response did not contain JSON')
  }

  const endBrace = text.lastIndexOf('}')
  const endBracket = text.lastIndexOf(']')
  const endIndex = Math.max(endBrace, endBracket)

  if (endIndex < startIndex) {
    throw new Error('Gemini response JSON was incomplete')
  }

  return text.slice(startIndex, endIndex + 1)
}

async function callGemini(prompt) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Gemini API key is missing')
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
  return JSON.parse(extractJson(text))
}

function getLanguageLabel(language) {
  const selected = getLanguage(language)
  return `${selected.name} (${selected.code})`
}

function sanitizeRoles(roles = []) {
  return roles.map((role, index) => ({
    person: Number(role.person || index + 1),
    role: String(role.role || `Person ${index + 1}`),
    instruction: String(role.instruction || ''),
    icon: String(role.icon || '👤'),
  }))
}

function sanitizeSteps(steps = []) {
  return steps.map((step) => ({
    title: String(step.title || 'Step'),
    detail: String(step.detail || ''),
    duration_seconds: Number(step.duration_seconds || 0),
  }))
}

export function geminiAvailable() {
  return Boolean(getApiKey())
}

export async function generateTriage({ emergency, language, peopleCount }) {
  const prompt = `You are an emergency stabilization AI.
Respond ONLY with valid JSON and no markdown.
Respond entirely in ${getLanguageLabel(language)}.

Input:
- emergency description: ${emergency}
- peopleCount: ${peopleCount}

Return exactly this JSON shape:
{
  "severity": "CRITICAL" | "MODERATE" | "LOW",
  "condition": "2-4 words",
  "steps": [{ "title": "", "detail": "", "duration_seconds": 0 }],
  "cprRequired": true,
  "roles": [{ "person": 1, "role": "", "instruction": "", "icon": "" }],
  "warning": "",
  "reportSummary": ""
}

Rules:
- Provide 3 to 5 steps.
- Keep titles concise.
- Keep details practical and calm.
- If collapse, no breathing, or pulselessness is likely, set cprRequired true.
- Assign bystander roles based on peopleCount.
- Output JSON only.`

  const result = await callGemini(prompt)

  return {
    severity: ['CRITICAL', 'MODERATE', 'LOW'].includes(result.severity) ? result.severity : 'LOW',
    condition: String(result.condition || 'General first aid'),
    steps: sanitizeSteps(result.steps),
    cprRequired: Boolean(result.cprRequired),
    roles: sanitizeRoles(result.roles),
    warning: String(result.warning || ''),
    reportSummary: String(result.reportSummary || ''),
  }
}

export async function rankHospitalsWithGemini({ emergency, hospitals, language }) {
  const condition = detectScenario(emergency).replace('-', ' ')
  const prompt = `Given the emergency: ${condition}
And these nearby hospitals: ${JSON.stringify(hospitals)}
Rank them from most to least appropriate for this specific emergency.
For each hospital provide one line explaining why it is or is not ideal.
Consider hospital name keywords, type, rating, and distance.
Respond ONLY in JSON array.
Respond in ${getLanguageLabel(language)}.

Each item must be:
{
  "name": "",
  "rank_reason": "",
  "specialty_match": ""
}`

  const result = await callGemini(prompt)
  return Array.isArray(result)
    ? result.map((item) => ({
        name: String(item.name || ''),
        rank_reason: String(item.rank_reason || ''),
        specialty_match: String(item.specialty_match || condition),
      }))
    : []
}

export async function generateDoctorReport(session) {
  const language = session.language || 'en'
  const prompt = `You are generating a formatted doctor handoff note.
Respond in ${getLanguageLabel(language)}.
Respond ONLY with valid JSON in this shape:
{ "report": "" }

Create a concise but clinically useful summary from this session JSON:
${JSON.stringify(session)}

Include:
- timeline summary
- current severity
- first aid actions done
- CPR summary if available
- hospital recommendation if available`

  const result = await callGemini(prompt)
  return String(result.report || '')
}
