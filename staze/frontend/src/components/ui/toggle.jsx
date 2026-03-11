import React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cn } from '@/lib/utils'

export function Toggle({ className, ...props }) {
  return (
    <TogglePrimitive.Root className={cn('clay-chip data-[state=on]:border-white/30 data-[state=on]:bg-white/14 data-[state=on]:text-white', className)} {...props} />
  )
}
