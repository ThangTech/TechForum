import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface DialogFrameProps {
  title: string
  // Width of the dialog in pixels. It never gets wider than the screen.
  width?: number
  open?: boolean
  onClose: () => void
  // A click on the dark area around the dialog closes it only when this is true. It stays false for dialogs with a form,
  // so a click next to the dialog does not throw away what was typed. Esc and the buttons still close it.
  closeOnBackdropClick?: boolean
  // Something shown on the right of the title, for example a status badge.
  headerExtra?: ReactNode
  // An error shown under the content, for example a validation message.
  error?: string | null
  // The buttons at the bottom.
  actions: ReactNode
  children: ReactNode
}

// The shared frame of the dialogs: title, content, error message and buttons.
export const DialogFrame = ({
  title,
  width = 480,
  open = true,
  onClose,
  closeOnBackdropClick = false,
  headerExtra,
  error,
  actions,
  children,
}: DialogFrameProps) => (
  <Dialog
    maxWidth={false}
    onClose={(_, reason) => {
      if (reason === 'backdropClick' && !closeOnBackdropClick) return
      onClose()
    }}
    open={open}
    slotProps={{ paper: { 'aria-label': title, sx: { width, maxWidth: 'calc(100% - 32px)' } } }}
  >
    <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography component="span" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>{title}</Typography>
        {headerExtra}
      </Stack>
    </DialogTitle>
    {/* MUI removes the top padding of the content that follows a title, so it is set again here: floating labels need the space. */}
    <DialogContent sx={{ px: 3, pb: 0, '.MuiDialogTitle-root + &': { pt: 2.5 } }}>
      {children}
      {error && <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{error}</Typography>}
    </DialogContent>
    <DialogActions sx={{ p: 3, gap: 1.5, flexWrap: 'wrap' }}>{actions}</DialogActions>
  </Dialog>
)
