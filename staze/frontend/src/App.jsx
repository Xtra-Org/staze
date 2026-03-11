import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import { useSession } from '@/hooks/useSession'
import { useLocation } from '@/hooks/useLocation'
import { useVoice } from '@/hooks/useVoice'
import { t, offlineScenarioInputs, quickScenarioKeys } from '@/translations'
import { Header } from '@/components/Header'
import { EmergencyInput } from '@/components/EmergencyInput'
import { QuickChips } from '@/components/QuickChips'
import { TriageResponse } from '@/components/TriageResponse'
import { CPRMode } from '@/components/CPRMode'
import { BystanderRoles } from '@/components/BystanderRoles'
import { SymptomTracker } from '@/components/SymptomTracker'
import { HospitalMap } from '@/components/HospitalMap'
import { SOSPanel } from '@/components/SOSPanel'
import { VoiceMode } from '@/components/VoiceMode'
import { IncidentReport } from '@/components/IncidentReport'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PanicSafeUI } from '@/components/PanicSafeUI'

const CACHE_KEY = 'staze-offline-cache'

function stripSymptomUpdates(text = '') {
  return text.split(/\s*Symptom update:/i)[0].trim()
}

function AppShell() {
  const { pushToast } = useToast()
  const { session, language, setLanguage, panicSafe, setPanicSafe, startSession, addTimeline, completeStep, updateSession } = useSession()
  const { coords, status: locationStatus, manualCity, setManualCity } = useLocation()
  const [emergency, setEmergency] = useState(stripSymptomUpdates(session.emergency || ''))
  const [peopleCount, setPeopleCount] = useState(3)
  const [triage, setTriage] = useState(session.triage)
  const [hospitals, setHospitals] = useState(session.hospitals || [])
  const [busy, setBusy] = useState(false)
  const [hospitalLoading, setHospitalLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [cprActive, setCprActive] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.85)
  const [escalation, setEscalation] = useState(false)
  const copy = t[language]
  const voice = useVoice(language, speechRate)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    if (!Object.keys(existing).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(offlineScenarioInputs))
    }
  }, [])

  useEffect(() => {
    const cleanedEmergency = stripSymptomUpdates(session.emergency || '')
    if (!session.emergency) return
    if (cleanedEmergency !== session.emergency) {
      updateSession({ emergency: cleanedEmergency })
    }
    setEmergency((current) => (current && current !== session.emergency ? current : cleanedEmergency))
  }, [session.emergency, updateSession])

  const cacheTriage = useCallback((key, value) => {
    const current = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    current[key] = value
    localStorage.setItem(CACHE_KEY, JSON.stringify(current))
  }, [])

  const fetchHospitals = useCallback(async (emergencyText) => {
    if (!coords || !navigator.onLine) return
    setHospitalLoading(true)
    try {
      const result = await api.hospitals({ lat: coords.lat, lng: coords.lng, emergency: emergencyText, language })
      setHospitals(result)
      updateSession({ hospitals: result })
    } catch {
      setHospitals([])
    } finally {
      setHospitalLoading(false)
    }
  }, [coords, language, updateSession])

  const submitEmergency = useCallback(async (overrideEmergency, options = {}) => {
    const emergencyText = overrideEmergency ?? emergency
    const visibleEmergencyText = stripSymptomUpdates(options.sessionEmergency ?? emergencyText)
    const preserveProgress = Boolean(options.preserveProgress)
    if (!emergencyText.trim()) return

    setBusy(true)
    setEscalation(false)
    setReportText('')
    setEmergency(visibleEmergencyText)

    if (preserveProgress) {
      updateSession({ language, emergency: visibleEmergencyText })
    } else {
      setTriage(null)
      setHospitals([])
      startSession({
        language,
        emergency: visibleEmergencyText,
        severity: '',
        condition: '',
        completedSteps: [],
        stepCompletions: {},
        hospitals: [],
        timeline: [],
        cprSummary: '',
        symptomAnswers: [],
        triage: null,
      }, { reset: true })
    }

    try {
      const result = await api.triage({ emergency: emergencyText, language, peopleCount })
      setTriage(result)
      updateSession({ triage: result, severity: result.severity, condition: result.condition, language, emergency: visibleEmergencyText })
      addTimeline(`${result.severity}: ${result.condition}`, result.severity === 'CRITICAL' ? 'red' : result.severity === 'MODERATE' ? 'amber' : 'green')
      if (result.cprRequired) {
        pushToast({ title: copy.startCPR, description: result.warning })
      }
      const scenarioKey = quickScenarioKeys.find((key) => offlineScenarioInputs[key][language] === emergencyText)
      if (scenarioKey) cacheTriage(scenarioKey, result)
      fetchHospitals(emergencyText)
    } catch {
      const localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
      const cached = Object.values(localCache).find((value) => value?.condition)
      if (cached) {
        setTriage(cached)
        updateSession({ triage: cached, severity: cached.severity, condition: cached.condition, language, emergency: visibleEmergencyText })
        addTimeline(copy.aiOffline, 'amber')
      } else {
        pushToast({ title: copy.aiOffline, description: copy.somethingWrong })
      }
    } finally {
      setBusy(false)
    }
  }, [addTimeline, cacheTriage, copy.aiOffline, copy.somethingWrong, copy.startCPR, emergency, fetchHospitals, language, peopleCount, pushToast, startSession, updateSession, voice])

  const handleQuickSelect = useCallback((text) => {
    setEmergency(text)
    submitEmergency(text)
  }, [submitEmergency])

  const handleVoiceInput = useCallback(() => {
    if (voice.listening) {
      voice.stopListening()
      return
    }
    voice.startListening((transcript) => {
      setEmergency(transcript)
      submitEmergency(transcript)
    }, (message) => {
      pushToast({ title: copy.voiceInput, description: message })
    })
  }, [copy.voiceInput, pushToast, submitEmergency, voice])

  const handleVoiceCommand = useCallback(() => {
    voice.startListening((transcript) => {
      const command = voice.parseCommand(transcript)
      const current = triage?.steps?.find((step) => !session.completedSteps.includes(step.title))
      if (command === 'next' && triage?.steps?.length) {
        if (current) voice.speak(`${current.title}. ${current.detail}`)
      } else if (command === 'repeat' && triage?.steps?.length) {
        if (current) voice.speak(`${current.title}. ${current.detail}`)
      } else if (command === 'ambulance') {
        window.location.href = 'tel:108'
      } else if (command === 'cpr') {
        setCprActive(true)
      } else {
        setEmergency(transcript)
      }
    }, (message) => {
      pushToast({ title: copy.voiceMode, description: message })
    })
  }, [copy.voiceMode, pushToast, session.completedSteps, triage?.steps, voice])

  const handleCompleteStep = useCallback((title) => {
    if (session.completedSteps.includes(title)) return
    completeStep(title)
    addTimeline(`${title} completed`, 'green')
    pushToast({ title: copy.completed, description: title })
  }, [addTimeline, completeStep, copy.completed, pushToast, session.completedSteps])

  const handleCheckIn = useCallback(async (answers) => {
    updateSession({ symptomAnswers: [...(session.symptomAnswers || []), answers] })
    const negativeCount = answers.filter((item) => item === false).length
    addTimeline(negativeCount >= 3 ? 'Symptoms worsening' : 'Check-in completed', negativeCount >= 3 ? 'red' : 'amber')
    if (negativeCount >= 3) setEscalation(true)
    const baseEmergency = stripSymptomUpdates(emergency || session.emergency || '')
    const symptomPrompt = `${baseEmergency} Symptom update: ${answers.map((item, index) => `${copy.checkQuestions[index]}=${item ? 'yes' : 'no'}`).join(', ')}`
    await submitEmergency(symptomPrompt, { preserveProgress: true, sessionEmergency: baseEmergency })
  }, [addTimeline, copy.checkQuestions, emergency, session.emergency, session.symptomAnswers, submitEmergency, updateSession])

  const handleGenerateReport = useCallback(async () => {
    const result = await api.report({ session })
    setReportText(result.report)
  }, [session])

  const handleCopyReport = useCallback(async () => {
    const text = reportText || JSON.stringify(session, null, 2)
    await navigator.clipboard.writeText(text)
    pushToast({ title: copy.reportCopied, description: copy.incidentReport })
  }, [copy.incidentReport, copy.reportCopied, pushToast, reportText, session])

  const handleShareReport = useCallback(async () => {
    const text = reportText || JSON.stringify(session, null, 2)
    if (navigator.share) {
      await navigator.share({ title: copy.incidentReport, text })
      pushToast({ title: copy.reportShared })
    } else {
      await navigator.clipboard.writeText(text)
      pushToast({ title: copy.reportCopied, description: copy.incidentReport })
    }
  }, [copy.incidentReport, copy.reportCopied, copy.reportShared, pushToast, reportText, session])

  const reshuffleRoles = useCallback(() => {
    if (!triage?.roles) return
    const shuffled = [...triage.roles].sort(() => Math.random() - 0.5)
    const next = { ...triage, roles: shuffled }
    setTriage(next)
    updateSession({ triage: next })
  }, [triage, updateSession])

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 pb-44 pt-4 md:px-6 md:pb-36">
      <OfflineBanner copy={copy} onStatusChange={setOnline} />
      <Header copy={copy} language={language} onLanguageChange={setLanguage} panicSafe={panicSafe} onPanicToggle={() => setPanicSafe((value) => !value)} onReportOpen={() => setReportOpen(true)} sessionStarted={Boolean(session.startedAt)} online={online} />

      <PanicSafeUI enabled={panicSafe}>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <EmergencyInput copy={copy} emergency={emergency} setEmergency={setEmergency} peopleCount={peopleCount} setPeopleCount={setPeopleCount} onSubmit={() => submitEmergency()} onVoiceToggle={handleVoiceInput} listening={voice.listening} voiceSupported={voice.supported} busy={busy} />
            <QuickChips copy={copy} language={language} onSelect={handleQuickSelect} />
            <TriageResponse copy={copy} triage={triage} completedSteps={session.completedSteps || []} stepCompletions={session.stepCompletions || {}} onCompleteStep={handleCompleteStep} onStartCpr={() => setCprActive(true)} speak={voice.speak} />
            <BystanderRoles copy={copy} roles={triage?.roles} onReshuffle={reshuffleRoles} />
            <HospitalMap copy={copy} coords={coords} hospitals={hospitals} loading={hospitalLoading} online={online} locationStatus={locationStatus} manualCity={manualCity} setManualCity={setManualCity} />
            <SymptomTracker copy={copy} triage={triage} onSubmitCheckIn={handleCheckIn} timeline={session.timeline || []} speak={voice.speak} forceEscalation={() => setEscalation(true)} />
            {escalation ? (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex items-center justify-center bg-red-950/80 p-4">
                  <div className="clay-panel max-w-lg p-6 text-center">
                    <Alert tone="red">
                      <div>
                        <AlertTitle>{copy.warning}</AlertTitle>
                        <AlertDescription>{copy.somethingWrong}</AlertDescription>
                      </div>
                    </Alert>
                    <a href="tel:102" className="mt-5 inline-flex min-h-[72px] items-center justify-center rounded-[20px] border border-red-400/30 bg-red-500/18 px-8 text-xl font-bold text-white shadow-[0_0_30px_rgba(255,71,87,0.24)]">102</a>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>

          <div className="space-y-6 xl:pt-1">
            <SOSPanel />
            <div className="clay-panel p-5">
              <h3 className="font-display text-xl text-white">{copy.voiceMode}</h3>
              <p className="mt-2 text-sm text-white/60">{copy.commandHints}</p>
              <Separator className="my-4" />
              <div className="text-sm text-white/60">{session.startedAt ? new Date(session.startedAt).toLocaleString() : 'Stand by'}</div>
            </div>
          </div>
        </div>
      </PanicSafeUI>

      <VoiceMode copy={copy} rate={speechRate} setRate={setSpeechRate} listening={voice.listening} speaking={voice.speaking} onListen={handleVoiceCommand} supported={voice.supported} />
      <IncidentReport open={reportOpen} onOpenChange={setReportOpen} copy={copy} session={session} report={reportText} onGenerate={handleGenerateReport} onCopy={handleCopyReport} onShare={handleShareReport} />
      <CPRMode copy={copy} active={cprActive} onClose={() => setCprActive(false)} speak={voice.speak} onSummary={(summary) => { updateSession({ cprSummary: `${summary.totalTime}, ${summary.cycles} cycles, ${summary.compressions} compressions` }); addTimeline(`CPR: ${summary.totalTime}`, 'red') }} />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}
