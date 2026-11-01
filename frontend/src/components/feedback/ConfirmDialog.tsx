import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'

interface ConfirmDialogProps {
  confirmLabel: string
  description: string
  isBusy?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export const ConfirmDialog = ({
  confirmLabel,
  description,
  isBusy = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) => (
  <Dialog open={isOpen} onClose={() => !isBusy && onCancel()} maxWidth={false} slotProps={{ paper: { 'aria-label': title, sx: { width: 440, maxWidth: 'calc(100% - 32px)' } } }}>
    <div className="p-6">
      <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button disabled={isBusy} onClick={onCancel} variant="outlined">Hủy</Button>
        <Button disabled={isBusy} onClick={onConfirm} variant="contained">{isBusy ? 'Đang xóa…' : confirmLabel}</Button>
      </div>
    </div>
  </Dialog>
)
