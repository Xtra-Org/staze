import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function OfflineBanner({ copy, onStatusChange }) {
  const MotionDiv = motion.div
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      onStatusChange?.(true)
    }
    const handleOffline = () => {
      setOnline(false)
      onStatusChange?.(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onStatusChange])

  return (
    <AnimatePresence>
      {!online ? (
        <MotionDiv initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="fixed left-4 right-4 top-4 z-[60]">
          <Alert tone="amber">
            <div>
              <AlertTitle>{copy.aiOffline}</AlertTitle>
              <AlertDescription>{copy.offlineBanner}</AlertDescription>
            </div>
          </Alert>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  )
}
