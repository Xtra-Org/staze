import React from 'react'
import { motion } from 'framer-motion'
import { ShieldPlus, FileText, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from './LanguageSelector'

export function Header({ copy, language, onLanguageChange, panicSafe, onPanicToggle, onReportOpen, sessionStarted, online }) {
  const MotionHeader = motion.header
  return (
    <MotionHeader initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="sticky top-4 z-40 mb-6">
      <div className="clay-panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/6 shadow-clay">
            <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle,_rgba(46,213,115,0.22),_transparent_65%)]" />
            <ShieldPlus className="relative h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-[0.24em] text-white">{copy.appName}</h1>
            <p className="text-sm text-white/55">{copy.tagline}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? copy.aiOnline : copy.aiOffline}
            </div>
            {sessionStarted ? (
              <Button variant="ghost" onClick={onReportOpen} className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80">
                <FileText className="h-4 w-4" />
                {copy.viewReport}
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
            <LanguageSelector language={language} onChange={onLanguageChange} />
            <button type="button" onClick={onPanicToggle} className={`clay-chip min-w-[132px] justify-center text-xs uppercase tracking-[0.18em] ${panicSafe ? 'border-white/30 bg-white/14 text-white' : 'text-white/65'}`}>
              {copy.panicSafe}
            </button>
          </div>
        </div>
      </div>
    </MotionHeader>
  )
}
