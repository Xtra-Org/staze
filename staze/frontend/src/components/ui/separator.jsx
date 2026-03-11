import React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

export function Separator({ className, orientation = 'horizontal', ...props }) {
  return <SeparatorPrimitive.Root className={cn(orientation === 'horizontal' ? 'h-px w-full bg-white/10' : 'h-full w-px bg-white/10', className)} orientation={orientation} {...props} />
}
