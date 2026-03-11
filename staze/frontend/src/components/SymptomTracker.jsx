import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function formatMinutes(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0')
  const seconds = String(value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function SymptomTracker({ copy, triage, onSubmitCheckIn, timeline, speak, forceEscalation }) {
  const MotionDiv = motion.div
  const [seconds, setSeconds] = useState(120)
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState([null, null, null, null])

  const allAnswered = useMemo(() => answers.every((item) => item !== null), [answers])

  useEffect(() => {
    if (!triage) return
    setSeconds(120)
    setOpen(false)
    setAnswers([null, null, null, null])
  }, [triage?.condition, triage?.severity, triage?.reportSummary])

  useEffect(() => {
    if (!triage) return undefined
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (open) return value
        if (value <= 1) {
          setOpen(true)
          speak(copy.checkInPrompt)
          return 120
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [copy.checkInPrompt, open, speak, triage])

  const worsening = useMemo(() => answers.filter((item) => item === false).length >= 3, [answers])

  useEffect(() => {
    if (worsening) {
      speak(copy.somethingWrong)
      forceEscalation?.()
    }
  }, [worsening, copy.somethingWrong, speak, forceEscalation])

  if (!triage) return null

  function handleSubmit() {
    if (!allAnswered) return
    onSubmitCheckIn(answers)
    setOpen(false)
    setSeconds(120)
    setAnswers([null, null, null, null])
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="clay-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-white">{copy.symptomTracker}</h3>
            <p className="text-sm text-white/55">{copy.checkInPrompt}</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/15 font-mono text-lg text-white">{formatMinutes(seconds)}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-white/65">{triage.condition}</div>
          <Button type="button" variant="clay" onClick={() => setOpen(true)}>{copy.checkNow}</Button>
        </div>
        {worsening ? (
          <Alert tone="red" className="mt-4">
            <div>
              <AlertTitle>{copy.warning}</AlertTitle>
              <AlertDescription>{copy.somethingWrong}</AlertDescription>
            </div>
          </Alert>
        ) : null}
      </div>

      <div className="clay-panel p-5">
        <h3 className="font-display text-2xl text-white">Timeline</h3>
        <div className="mt-4 space-y-4">
          <AnimatePresence>
            {timeline.map((entry) => (
              <MotionDiv key={entry.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="flex gap-3">
                <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${entry.tone === 'green' ? 'bg-emerald-400' : entry.tone === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.16em] text-white/40">{entry.time}</div>
                  <div className="text-white/75">{entry.summary}</div>
                </div>
              </MotionDiv>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.checkInPrompt}</DialogTitle>
            <DialogDescription>{triage.condition}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {copy.checkQuestions.map((question, index) => (
              <div key={question} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
                <div className="mb-3 text-white">{question}</div>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant={answers[index] === true ? 'success' : 'clay'} className="min-h-16" onClick={() => setAnswers((current) => current.map((item, itemIndex) => itemIndex === index ? true : item))}>{copy.yes}</Button>
                  <Button type="button" variant={answers[index] === false ? 'critical' : 'clay'} className="min-h-16" onClick={() => setAnswers((current) => current.map((item, itemIndex) => itemIndex === index ? false : item))}>{copy.no}</Button>
                </div>
              </div>
            ))}
            {!allAnswered ? <div className="text-sm text-amber-200/85">{copy.answerAllQuestions}</div> : null}
            <Button type="button" variant="critical" disabled={!allAnswered} onClick={handleSubmit}>{copy.submit}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
