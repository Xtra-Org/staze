import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Alert({ className, children, tone = 'amber', ...props }) {
  const tones = {
    amber: 'border-amber-400/20 bg-amber-500/12 text-amber-50',
    red: 'border-red-400/20 bg-red-500/12 text-red-50',
    blue: 'border-sky-400/20 bg-sky-500/12 text-sky-50',
  }
  return (
    <div className={cn('clay-panel flex items-start gap-3 p-4', tones[tone], className)} {...props}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, ...props }) {
  return <h4 className={cn('font-display text-base text-white', className)} {...props} />
}

export function AlertDescription({ className, ...props }) {
  return <p className={cn('mt-1 text-sm text-white/75', className)} {...props} />
}
