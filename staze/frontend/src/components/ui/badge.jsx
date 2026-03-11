import React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, tone = 'default', ...props }) {
  const tones = {
    default: 'border-white/10 bg-white/8 text-white/85',
    critical: 'border-red-400/25 bg-red-500/14 text-red-100 shadow-[0_0_30px_rgba(255,71,87,0.24)]',
    success: 'border-emerald-400/25 bg-emerald-500/14 text-emerald-100 shadow-[0_0_20px_rgba(46,213,115,0.22)]',
    amber: 'border-amber-400/25 bg-amber-500/14 text-amber-100',
    blue: 'border-sky-400/25 bg-sky-500/14 text-sky-100',
    purple: 'border-violet-400/25 bg-violet-500/14 text-violet-100 shadow-[0_0_40px_rgba(139,92,246,0.3)]',
  }

  return <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]', tones[tone], className)} {...props} />
}
