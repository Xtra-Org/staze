import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const BPM = 110
const BEAT_MS = (60 / BPM) * 1000

function playBeat() {
  const ctx = new window.AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 80
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.8, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.08)
}

function formatElapsed(total) {
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function CPRMode({ copy, active, onClose, speak, onSummary }) {
  const MotionDiv = motion.div
  const [compression, setCompression] = useState(1)
  const [cycle, setCycle] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [breathCountdown, setBreathCountdown] = useState(0)
  const [flash, setFlash] = useState(false)
  const [pauseAlert, setPauseAlert] = useState(false)
  const lastInteraction = useRef(0)
  const compressionRef = useRef(1)
  const previousBreathCountdown = useRef(0)

  useEffect(() => {
    if (!active) return undefined
    setCompression(1)
    compressionRef.current = 1
    setCycle(1)
    setElapsed(0)
    setBreathCountdown(0)
    setFlash(false)
    setPauseAlert(false)
    lastInteraction.current = Date.now()
    previousBreathCountdown.current = 0
    return undefined
  }, [active])

  useEffect(() => {
    compressionRef.current = compression
  }, [compression])

  useEffect(() => {
    if (!active || breathCountdown > 0) return undefined

    const beatTimer = window.setInterval(() => {
      lastInteraction.current = Date.now()
      playBeat()
      speak(copy.cprBeat, { rate: 1, pitch: 1.1 })

      if (compressionRef.current >= 30) {
        setFlash(true)
        setBreathCountdown(5)
        setCycle((current) => current + 1)
        speak(copy.cprBreath, { rate: 1, pitch: 1.1 })
        return
      }

      const nextCompression = compressionRef.current + 1
      compressionRef.current = nextCompression
      setCompression(nextCompression)
    }, BEAT_MS)

    return () => {
      window.clearInterval(beatTimer)
    }
  }, [active, breathCountdown, copy.cprBeat, copy.cprBreath, speak])

  useEffect(() => {
    if (!active) return undefined

    const elapsedTimer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    const inactivityTimer = window.setInterval(() => {
      const idle = Date.now() - lastInteraction.current > 5000
      setPauseAlert(idle)
      if (idle) {
        speak(copy.keepGoing, { rate: 1, pitch: 1.1 })
      }
    }, 5000)

    return () => {
      window.clearInterval(elapsedTimer)
      window.clearInterval(inactivityTimer)
    }
  }, [active, copy.keepGoing, speak])

  useEffect(() => {
    if (!active || elapsed === 0 || elapsed % 120 !== 0) return
    speak(copy.switchCompressor)
  }, [active, elapsed, copy.switchCompressor, speak])

  useEffect(() => {
    if (!flash) return undefined
    const timer = window.setTimeout(() => setFlash(false), 600)
    return () => window.clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    if (!breathCountdown) return undefined
    const timer = window.setTimeout(() => {
      setBreathCountdown((value) => {
        const next = value - 1
        if (next === 0) speak(copy.cprResume, { rate: 1, pitch: 1.05 })
        return next
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [breathCountdown, copy.cprResume, speak])

  useEffect(() => {
    if (previousBreathCountdown.current > 0 && breathCountdown === 0) {
      compressionRef.current = 1
      setCompression(1)
      lastInteraction.current = Date.now()
    }
    previousBreathCountdown.current = breathCountdown
  }, [breathCountdown])

  const summary = useMemo(() => ({ totalTime: formatElapsed(elapsed), cycles: Math.max(cycle - 1, 0), compressions: Math.max((cycle - 1) * 30 + compression - 1, 0) }), [compression, cycle, elapsed])
  const inBreathPause = breathCountdown > 0
  const compressionProgress = inBreathPause ? 100 : (compression / 30) * 100

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.22),_transparent_34%),linear-gradient(180deg,#080B14_0%,#090d19_100%)] p-4" onPointerDown={() => { lastInteraction.current = Date.now(); setPauseAlert(false) }}>
      <AnimatePresence>
        {flash ? <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 bg-sky-400" /> : null}
        {pauseAlert ? <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 bg-red-500" /> : null}
      </AnimatePresence>

      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="flex w-full items-center justify-between">
          <Badge tone="critical">{copy.cprTime}: {formatElapsed(elapsed)}</Badge>
          <Badge tone="amber">{copy.cycle} {cycle}</Badge>
        </div>

        <MotionDiv animate={inBreathPause ? { scale: 1 } : { scale: [1, 1.18, 1] }} transition={inBreathPause ? { duration: 0.2 } : { repeat: Number.POSITIVE_INFINITY, duration: 60 / 110 }} className={`flex h-[220px] w-[220px] items-center justify-center rounded-full border border-violet-300/20 shadow-[0_0_45px_rgba(139,92,246,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] ${inBreathPause ? 'bg-sky-500/12' : 'bg-violet-500/18'}`}>
          <div className="flex h-[150px] w-[150px] flex-col items-center justify-center rounded-full border border-white/10 bg-[#0d1326]">
            <div className="font-display text-6xl text-white">{compression}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.28em] text-white/50">{inBreathPause ? 'PAUSE' : '110 BPM'}</div>
          </div>
        </MotionDiv>

        <div className="grid w-full max-w-xl gap-4">
          <div className="flex items-center justify-center gap-3">
            {Array.from({ length: 6 }).map((_, index) => <span key={index} className={`h-3 w-3 rounded-full ${index < Math.max(cycle - 1, 0) ? 'bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.7)]' : 'bg-white/10'}`} />)}
          </div>
          {breathCountdown > 0 ? (
            <div className="clay-panel p-4">
              <div className="font-display text-xl text-white">{copy.cprBreath}</div>
              <div className="mt-2 font-mono text-2xl text-sky-200">{breathCountdown}</div>
              <Progress value={(breathCountdown / 5) * 100} className="mt-3" indicatorClassName="bg-gradient-to-r from-sky-500 to-blue-300" />
            </div>
          ) : null}
          <Progress value={compressionProgress} className="h-4" indicatorClassName="bg-gradient-to-r from-violet-500 to-fuchsia-400" />
        </div>

        <div className="clay-panel grid w-full max-w-xl gap-3 p-5 text-left">
          <div className="font-mono text-sm text-white/55">{copy.incidentReport}</div>
          <div className="grid gap-1 text-white/80 sm:grid-cols-3">
            <div>Total time: {summary.totalTime}</div>
            <div>Cycles: {summary.cycles}</div>
            <div>Compressions: {summary.compressions}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button type="button" variant="critical" onClick={() => { onSummary(summary); onClose() }}>{copy.addToReport}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>{copy.endCpr}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
