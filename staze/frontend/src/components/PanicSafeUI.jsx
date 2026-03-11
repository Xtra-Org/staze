import React from 'react'

export function PanicSafeUI({ enabled, children }) {
  return <div className={enabled ? 'panic-safe space-y-6' : 'space-y-6'}>{children}</div>
}
