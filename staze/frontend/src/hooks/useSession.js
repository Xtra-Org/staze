import { useCallback, useEffect, useMemo, useState } from 'react'

const SESSION_KEY = 'staze-session'
const LANGUAGE_KEY = 'staze-language'
const PANIC_KEY = 'staze-panic-safe'

function createDefaultSession() {
  return {
    startedAt: null,
    language: 'en',
    emergency: '',
    severity: '',
    condition: '',
    completedSteps: [],
    stepCompletions: {},
    hospitals: [],
    timeline: [],
    cprSummary: '',
    symptomAnswers: [],
    triage: null,
  }
}

function normalizeSession(session) {
  const base = createDefaultSession()
  const next = { ...base, ...(session || {}) }
  const seenTimeline = new Set()

  return {
    ...next,
    completedSteps: Array.from(new Set((next.completedSteps || []).filter(Boolean))),
    stepCompletions: typeof next.stepCompletions === 'object' && next.stepCompletions ? next.stepCompletions : {},
    hospitals: Array.isArray(next.hospitals) ? next.hospitals : [],
    symptomAnswers: Array.isArray(next.symptomAnswers) ? next.symptomAnswers : [],
    timeline: (Array.isArray(next.timeline) ? next.timeline : []).filter((entry) => {
      if (!entry?.summary) return false
      const key = `${entry.time || ''}|${entry.summary}|${entry.tone || ''}`
      if (seenTimeline.has(key)) return false
      seenTimeline.add(key)
      return true
    }),
  }
}

export function useSession() {
  const [session, setSession] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      return parsed ? normalizeSession(parsed) : createDefaultSession()
    } catch {
      return createDefaultSession()
    }
  })

  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en')
  const [panicSafe, setPanicSafe] = useState(() => localStorage.getItem(PANIC_KEY) === 'true')

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])

  useEffect(() => {
    localStorage.setItem(PANIC_KEY, String(panicSafe))
  }, [panicSafe])

  const startSession = useCallback((payload, options = {}) => {
    setSession((current) => {
      const reset = Boolean(options.reset)
      const base = reset ? createDefaultSession() : current
      return normalizeSession({
        ...base,
        ...payload,
        startedAt: reset ? new Date().toISOString() : current.startedAt || new Date().toISOString(),
      })
    })
  }, [])

  const addTimeline = useCallback((summary, tone = 'amber') => {
    setSession((current) => ({
      ...current,
      timeline: current.timeline[0]?.summary === summary && current.timeline[0]?.tone === tone
        ? current.timeline
        : [
            {
              id: crypto.randomUUID(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              summary,
              tone,
            },
            ...current.timeline,
          ],
    }))
  }, [])

  const completeStep = useCallback((title) => {
    setSession((current) => {
      if (current.completedSteps.includes(title)) {
        return current
      }

      return {
        ...current,
        completedSteps: [...current.completedSteps, title],
        stepCompletions: {
          ...current.stepCompletions,
          [title]: new Date().toISOString(),
        },
      }
    })
  }, [])

  const updateSession = useCallback((patch) => {
    setSession((current) => normalizeSession({ ...current, ...patch }))
  }, [])

  const resetSession = useCallback(() => {
    setSession(createDefaultSession())
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return useMemo(() => ({
    session,
    language,
    setLanguage,
    panicSafe,
    setPanicSafe,
    startSession,
    addTimeline,
    completeStep,
    updateSession,
    resetSession,
  }), [session, language, panicSafe, startSession, addTimeline, completeStep, updateSession, resetSession])
}
