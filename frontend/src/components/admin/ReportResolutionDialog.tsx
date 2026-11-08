import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { AdminDialog } from './AdminDialog'

interface ReportResolutionDialogProps {
  decision: 'accepted' | 'rejected' | null
  requestError: string | null
  isBusy: boolean
  onClose: () => void
  onConfirm: (note: string) => void
}

export const ReportResolutionDialog = ({
  decision,
  isBusy,
  onClose,
  onConfirm,
  requestError,
}: ReportResolutionDialogProps) => {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (isBusy) return
    setNote('')
    setError(null)
    onClose()
  }

  const confirm = () => {
    const normalizedNote = note.trim()
    if (!normalizedNote) {
      setError('Vui lòng ghi lý do xử lý báo cáo.')
      return
    }
    onConfirm(normalizedNote)
  }

  const isAccepted = decision === 'accepted'
  return (
    <AdminDialog
      actions={
        <>
          <Button disabled={isBusy} onClick={close} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={confirm} variant="contained">{isBusy ? 'Đang xử lý…' : (isAccepted ? 'Chấp nhận' : 'Bác bỏ')}</Button>
        </>
      }
      error={error || requestError}
      onClose={close}
      open={decision !== null}
      title={isAccepted ? 'Chấp nhận báo cáo' : 'Bác bỏ báo cáo'}
    >
      <Typography color="text.secondary" sx={{ lineHeight: '1.5rem' }} variant="body2">
        Quyết định được lưu cùng tài khoản và thời điểm xử lý để phục vụ nhật ký quản trị.
      </Typography>
      <TextField
        disabled={isBusy}
        helperText={`${note.length}/1.000`}
        id="resolution-note"
        label="Lý do xử lý"
        minRows={4}
        multiline
        onChange={(event) => setNote(event.target.value)}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        sx={{ mt: 2.5 }}
        value={note}
      />
    </AdminDialog>
  )
}
