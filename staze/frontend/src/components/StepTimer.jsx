import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0')
  const seconds = String(value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function playChime() {
  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.18, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.35)
}

export function StepTimer({ seconds, onComplete, speakComplete, active = true }) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)
  const completedRef = useRef(false)
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const progress = useMemo(() => (seconds ? remaining / seconds : 0), [remaining, seconds])

  const finalize = useCallback(({ playAudio = true, announce = true } = {}) => {
    if (completedRef.current) return
    completedRef.current = true
    setPaused(true)
    setRemaining(0)
    if (playAudio) playChime()
    if (announce) speakComplete?.()
    onComplete?.()
  }, [onComplete, speakComplete])

  useEffect(() => {
    completedRef.current = false
    setRemaining(seconds)
    setPaused(false)
  }, [seconds])

  useEffect(() => {
    if (!seconds || paused || !active || completedRef.current) return undefined
    if (remaining <= 0) {
      finalize()
      return undefined
    }
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(value - 1, 0)), 1000)
    return () => window.clearTimeout(timer)
  }, [active, finalize, paused, remaining, seconds])

  return (
    <div className="mt-4 rounded-[20px] border border-white/8 bg-black/15 p-4">
      <div className="flex items-center gap-4">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
          <circle cx="32" cy="32" r={radius} stroke={remaining === 0 ? '#2ed573' : '#8b5cf6'} strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round" />
        </svg>
        <div>
          <div className="font-mono text-2xl text-white">{formatTime(remaining)}</div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Timer</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={() => setPaused((value) => !value)}><Pause className="h-4 w-4" />{paused ? 'Resume' : 'Pause'}</Button>
        <Button type="button" variant="ghost" onClick={() => { completedRef.current = false; setRemaining(seconds); setPaused(false) }}><RotateCcw className="h-4 w-4" />Restart</Button>
        <Button type="button" variant="ghost" onClick={() => finalize({ playAudio: false, announce: false })}><SkipForward className="h-4 w-4" />Skip</Button>
      </div>
    </div>
  )
}
