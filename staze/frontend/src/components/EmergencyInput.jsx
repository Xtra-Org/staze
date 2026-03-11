import React from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Minus, Plus, Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmergencyInput({ copy, emergency, setEmergency, peopleCount, setPeopleCount, onSubmit, onVoiceToggle, listening, voiceSupported, busy }) {
  const MotionSection = motion.section
  return (
    <MotionSection initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="clay-panel p-5 md:p-7">
      <div className="mb-5">
        <h2 className="font-display text-3xl text-white md:text-4xl">{copy.heroTitle}</h2>
        <p className="mt-3 max-w-2xl text-white/65">{copy.heroSub}</p>
      </div>

      <textarea value={emergency} onChange={(event) => setEmergency(event.target.value)} placeholder={copy.inputPlaceholder} className="min-h-[128px] w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-10px_30px_rgba(0,0,0,0.3)] outline-none placeholder:text-white/30 focus:border-white/20" />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        {voiceSupported ? (
          <Button type="button" onClick={onVoiceToggle} variant={listening ? 'critical' : 'clay'} className="justify-center lg:justify-start">
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? copy.stopVoice : copy.voiceInput}
          </Button>
        ) : <div />}

        <div className="mx-auto flex flex-col items-center gap-3">
          <span className="text-center text-sm text-white/60">{copy.peopleCount}</span>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 shadow-clay">
            <button type="button" className="clay-chip h-10 w-10 justify-center p-0" onClick={() => setPeopleCount((value) => Math.max(1, value - 1))}><Minus className="h-4 w-4" /></button>
            <span className="w-10 text-center font-mono text-xl text-white">{peopleCount}</span>
            <button type="button" className="clay-chip h-10 w-10 justify-center p-0" onClick={() => setPeopleCount((value) => Math.min(9, value + 1))}><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <Button type="button" variant="critical" size="lg" disabled={!emergency.trim() || busy} onClick={onSubmit} className="w-full justify-center lg:justify-center">
          <Siren className="h-5 w-5" />
          {busy ? '...' : copy.getHelp}
        </Button>
      </div>
    </MotionSection>
  )
}
