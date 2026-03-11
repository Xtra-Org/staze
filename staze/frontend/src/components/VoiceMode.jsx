import React from 'react'
import { Mic, Volume2, Waves } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

export function VoiceMode({ copy, rate, setRate, listening, speaking, onListen, supported }) {
  if (!supported) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,320px)] rounded-[28px] border border-white/10 bg-[#0e1324]/92 p-4 shadow-clay backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg text-white">{copy.voiceMode}</div>
          <div className="text-xs text-white/50">{copy.commandHints}</div>
        </div>
        <Button type="button" variant={listening ? 'critical' : 'clay'} size="icon" onClick={onListen} className="relative">
          <Mic className="h-5 w-5" />
          {listening ? <span className="absolute inset-0 rounded-2xl border border-red-400/35 animate-ping" /> : null}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3 text-white/70">
        <Volume2 className="h-4 w-4" />
        <span className="text-sm">{copy.speechRate}: {rate.toFixed(2)}x</span>
      </div>
      <Slider className="mt-3" min={0.6} max={1.2} step={0.05} value={[rate]} onValueChange={(value) => setRate(value[0])} />
      {speaking ? <div className="mt-4 flex items-end gap-1">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="w-2 rounded-full bg-sky-400" style={{ height: `${10 + ((index + 1) % 3) * 8}px` }} />)}<Waves className="ml-2 h-4 w-4 text-sky-300" /></div> : null}
    </div>
  )
}
