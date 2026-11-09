import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

// Asks "Bỏ nội dung đang nhập?" before a form dialog is closed with something typed in it.
// Use requestClose for Esc and for the Cancel button, and render discardDialog next to the dialog.
// A form that is saved is closed by its owner and does not go through here.
export const useDiscardGuard = (isDirty: boolean, onClose: () => void): { requestClose: () => void; discardDialog: ReactNode } => {
  const [isAsking, setIsAsking] = useState(false)

  const requestClose = () => {
    if (isDirty) setIsAsking(true)
    else onClose()
  }

  const discardDialog = (
    <ConfirmDialog
      cancelLabel="Tiếp tục nhập"
      confirmLabel="Bỏ nội dung"
      description="Những gì bạn đã nhập sẽ không được lưu."
      isOpen={isAsking}
      onCancel={() => setIsAsking(false)}
      onConfirm={() => {
        setIsAsking(false)
        onClose()
      }}
      title="Bỏ nội dung đang nhập?"
    />
  )

  return { requestClose, discardDialog }
}
