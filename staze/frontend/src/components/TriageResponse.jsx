import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, HeartPulse } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StepTimer } from './StepTimer'

function severityTone(severity) {
  if (severity === 'CRITICAL') return 'critical'
  if (severity === 'MODERATE') return 'amber'
  return 'success'
}

export function TriageResponse({ copy, triage, completedSteps, stepCompletions, onCompleteStep, onStartCpr, speak }) {
  const MotionSection = motion.section
  const MotionArticle = motion.article
  const MotionDiv = motion.div
  const [summaryOpen, setSummaryOpen] = useState(false)
  const lastSpokenStepRef = useRef('')
  const steps = triage?.steps || []
  const currentStepIndex = steps.findIndex((step) => !completedSteps.includes(step.title))
  const activeStepIndex = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex

  useEffect(() => {
    if (!triage) {
      lastSpokenStepRef.current = ''
      return
    }

    if (currentStepIndex === -1) {
      lastSpokenStepRef.current = `${triage.condition}:complete`
      return
    }

    const currentStep = triage.steps[currentStepIndex]
    const speechKey = `${triage.condition}:${currentStepIndex}:${currentStep.title}`

    if (!currentStep || lastSpokenStepRef.current === speechKey) return

    lastSpokenStepRef.current = speechKey
    speak?.(`${currentStep.title}. ${currentStep.detail}`)
  }, [currentStepIndex, speak, triage])

  if (!triage) return null

  return (
    <AnimatePresence>
      <MotionSection initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="clay-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MotionDiv initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <Badge tone={severityTone(triage.severity)}>{triage.severity}</Badge>
            </MotionDiv>
            <div>
              <div className="font-display text-2xl text-white">{triage.condition}</div>
              <div className="text-sm text-white/55">AI-guided stabilization sequence</div>
            </div>
          </div>
          {triage.cprRequired ? (
            <Button type="button" variant="clay" onClick={onStartCpr} className="border-violet-400/30 bg-violet-500/14 text-violet-50 shadow-[0_6px_0_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),0_0_40px_rgba(139,92,246,0.35)]">
              <HeartPulse className="h-5 w-5" />
              {copy.startCPR}
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          {triage.steps.map((step, index) => {
            const done = completedSteps.includes(step.title)
            const isCurrent = !done && index === activeStepIndex
            const isUpcoming = !done && index > activeStepIndex
            return (
              <MotionArticle key={`${step.title}-${index}`} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }} className={`rounded-[24px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${done ? 'border-emerald-400/16 bg-emerald-500/8' : isCurrent ? 'border-violet-400/20 bg-violet-500/6' : 'border-white/8 bg-black/15'} ${isUpcoming ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${done ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50' : isCurrent ? 'border-violet-400/30 bg-violet-500/12 text-violet-50' : 'border-white/10 bg-white/6 text-white'}`}>
                      <span className="font-display text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-white">{step.title}</h3>
                      <p className="mt-2 max-w-2xl text-white/70">{step.detail}</p>
                      {done && stepCompletions?.[step.title] ? <div className="mt-3 text-xs uppercase tracking-[0.16em] text-emerald-200/70">{copy.completed} {new Date(stepCompletions[step.title]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div> : null}
                    </div>
                  </div>
                  <Button type="button" variant={done ? 'success' : isCurrent ? 'clay' : 'ghost'} disabled={isUpcoming} onClick={() => onCompleteStep(step.title)}>{done ? copy.completed : copy.stepComplete}</Button>
                </div>
                {step.duration_seconds > 0 && isCurrent ? <StepTimer seconds={step.duration_seconds} active={isCurrent} onComplete={() => onCompleteStep(step.title)} speakComplete={() => speak(copy.completed)} /> : null}
              </MotionArticle>
            )
          })}
        </div>

        {triage.warning ? <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-amber-50 shadow-[0_0_20px_rgba(255,165,2,0.15)]"><div className="font-display text-lg">{copy.warning}</div><p className="mt-1 text-sm text-amber-50/80">{triage.warning}</p></div> : null}

        <button type="button" onClick={() => setSummaryOpen((value) => !value)} className="mt-5 flex w-full items-center justify-between rounded-[20px] border border-white/8 bg-black/15 px-4 py-4 text-left text-white">
          <div>
            <div className="font-display text-lg">{copy.doctorSummary}</div>
            <div className="text-sm text-white/50">{summaryOpen ? copy.hideSummary : copy.showSummary}</div>
          </div>
          {summaryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {summaryOpen ? <p className="mt-3 rounded-[20px] border border-white/8 bg-black/10 px-4 py-4 text-white/70">{triage.reportSummary}</p> : null}
      </MotionSection>
    </AnimatePresence>
  )
}
