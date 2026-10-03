import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'

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
  <Dialog
    aria-label={title}
    isOpen={isOpen}
    onOpenChange={(open) => !open && !isBusy && onCancel()}
    padding={0}
    purpose="required"
    width={440}
  >
    <div className="p-6">
      <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button isDisabled={isBusy} label="Hủy" onClick={onCancel} variant="secondary" />
        <Button isDisabled={isBusy} label={isBusy ? 'Đang xóa…' : confirmLabel} onClick={onConfirm} variant="primary" />
      </div>
    </div>
  </Dialog>
)
