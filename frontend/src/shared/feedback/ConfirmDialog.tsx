import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface ConfirmDialogProps {
  confirmLabel: string
  // The label of the button that gives up the question. It is "Hủy" unless another word fits better.
  cancelLabel?: string
  // The label of the confirm button while it is busy.
  busyLabel?: string
  description: string
  isBusy?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export const ConfirmDialog = ({
  confirmLabel,
  cancelLabel = 'Hủy',
  busyLabel = 'Đang xóa…',
  description,
  isBusy = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) => (
  <Dialog open={isOpen} onClose={() => !isBusy && onCancel()} maxWidth={false} slotProps={{ paper: { 'aria-label': title, sx: { width: 440, maxWidth: 'calc(100% - 32px)' } } }}>
    <DialogTitle sx={{ px: 3, pt: 3, pb: 0, color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>{title}</DialogTitle>
    <DialogContent sx={{ px: 3, pt: 1.5, pb: 0 }}>
      <DialogContentText sx={{ mt: 1.5, fontSize: '0.875rem', lineHeight: '1.5rem' }}>{description}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 3, pt: 3, gap: 1.5 }}>
      <Button disabled={isBusy} onClick={onCancel} variant="outlined">{cancelLabel}</Button>
      <Button disabled={isBusy} onClick={onConfirm} variant="contained">{isBusy ? busyLabel : confirmLabel}</Button>
    </DialogActions>
  </Dialog>
)
