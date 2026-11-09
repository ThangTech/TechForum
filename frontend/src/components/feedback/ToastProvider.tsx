import Alert from '@mui/material/Alert'
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar'
import { useCallback, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react'
import { ToastContext, type ToastSeverity } from './toastState'

interface ToastMessage {
  // A new key makes the Snackbar start again when a second message comes while the first one is still shown.
  key: number
  message: string
  severity: ToastSeverity
}

const HIDE_AFTER_MS = 4000

// Shows the short messages of the whole site (saved, deleted, failed) in the bottom corner. Only one is shown at a
// time; a newer message replaces the older one. The Alert inside has the icon of its kind and is read by screen readers.
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const showToast = useCallback((message: string, severity: ToastSeverity = 'success') => {
    setToast((current) => ({ key: (current?.key ?? 0) + 1, message, severity }))
    setIsOpen(true)
  }, [])

  const close = (_event: Event | SyntheticEvent | null, reason: SnackbarCloseReason) => {
    // A click somewhere else on the page must not hide the message before the visitor could read it.
    if (reason === 'clickaway') return
    setIsOpen(false)
  }

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={HIDE_AFTER_MS}
        key={toast?.key}
        onClose={close}
        open={isOpen}
        slotProps={{ transition: { onExited: () => setToast(null) } }}
      >
        {/* Snackbar needs a child that exists even while it closes, so the last message stays until it is gone. */}
        <Alert onClose={() => setIsOpen(false)} severity={toast?.severity ?? 'success'} sx={{ width: '100%', alignItems: 'center' }} variant="filled">
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
