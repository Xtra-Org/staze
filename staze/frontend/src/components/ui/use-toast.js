import * as React from 'react'

const ToastContext = React.createContext(null)

export function ToastContextProvider({ children, value }) {
  return React.createElement(ToastContext.Provider, { value }, children)
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastContextProvider')
  }
  return context
}