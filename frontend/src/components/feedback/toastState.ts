import { createContext, useContext } from 'react'

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning'

export interface ToastContextValue {
  // Shows a short message that disappears by itself (a success has a green tick, an error a red mark).
  showToast: (message: string, severity?: ToastSeverity) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider.')
  return value
}
