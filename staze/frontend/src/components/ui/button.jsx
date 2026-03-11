import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[3px]',
  {
    variants: {
      variant: {
        clay: 'clay-button bg-white/8 text-white border border-white/10 hover:border-white/20',
        critical: 'clay-button bg-[rgba(255,71,87,0.16)] text-white border border-red-400/25 shadow-[0_6px_0_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),0_0_30px_rgba(255,71,87,0.28)]',
        success: 'clay-button bg-[rgba(46,213,115,0.14)] text-white border border-emerald-400/25',
        ghost: 'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80',
      },
      size: {
        default: 'min-h-12 px-6 py-3',
        lg: 'min-h-14 px-7 py-4 text-base',
        icon: 'h-12 w-12 rounded-2xl p-0',
      },
    },
    defaultVariants: {
      variant: 'clay',
      size: 'default',
    },
  },
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
