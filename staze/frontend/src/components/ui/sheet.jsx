import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

export function SheetContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content className={cn('fixed bottom-0 left-0 right-0 z-50 mt-24 rounded-t-[32px] border border-white/10 bg-[#0b1020]/95 p-6 shadow-clay backdrop-blur-xl', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />
}

export function SheetTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('font-display text-2xl text-white', className)} {...props} />
}
