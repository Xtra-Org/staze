import React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export function Progress({ className, value = 0, indicatorClassName, ...props }) {
  return (
    <ProgressPrimitive.Root className={cn('relative h-3 w-full overflow-hidden rounded-full bg-white/10', className)} value={value} {...props}>
      <ProgressPrimitive.Indicator className={cn('h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all', indicatorClassName)} style={{ transform: `translateX(-${100 - value}%)` }} />
    </ProgressPrimitive.Root>
  )
}
