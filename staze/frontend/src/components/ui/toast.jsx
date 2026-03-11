import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { ToastContextProvider } from './use-toast'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const pushToast = React.useCallback((toast) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    return id
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContextProvider value={{ pushToast, removeToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root key={toast.id} open duration={2800} onOpenChange={(open) => !open && removeToast(toast.id)} className="pointer-events-auto relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#14192d]/94 p-4 text-white shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <ToastPrimitive.Title className="font-display text-base text-white">{toast.title}</ToastPrimitive.Title>
                {toast.description ? <ToastPrimitive.Description className="mt-1 text-sm text-white/70">{toast.description}</ToastPrimitive.Description> : null}
              </div>
              <ToastPrimitive.Close className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70">
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 left-4 z-[80] flex w-[min(92vw,360px)] max-w-[360px] flex-col gap-3 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContextProvider>
  )
}
