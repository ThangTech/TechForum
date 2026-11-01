import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useState } from 'react'
import TextField from '@mui/material/TextField'

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
    <Dialog open={decision !== null} onClose={() => close()} maxWidth={false} slotProps={{ paper: { 'aria-label': isAccepted ? 'Chấp nhận báo cáo' : 'Bác bỏ báo cáo', sx: { width: 480, maxWidth: 'calc(100% - 32px)' } } }}>
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">
          {isAccepted ? 'Chấp nhận báo cáo' : 'Bác bỏ báo cáo'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Quyết định được lưu cùng tài khoản và thời điểm xử lý để phục vụ nhật ký quản trị.
        </p>
        <TextField
          className="mt-5"
          disabled={isBusy}
          helperText={`${note.length}/1.000`}
          id="resolution-note"
          label="Lý do xử lý"
          minRows={4}
          multiline
          onChange={(event) => setNote(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          value={note}
        />
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        {requestError && <p className="mt-3 text-sm text-red-700" role="alert">{requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isBusy} onClick={close} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={confirm} variant="contained">{isBusy ? 'Đang xử lý…' : (isAccepted ? 'Chấp nhận' : 'Bác bỏ')}</Button>
        </div>
      </div>
    </Dialog>
  )
}
