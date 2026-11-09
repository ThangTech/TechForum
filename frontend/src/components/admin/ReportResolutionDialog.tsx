import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'

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

  const { requestClose, discardDialog } = useDiscardGuard(note.trim() !== '', close)
  const closeIfIdle = () => {
    if (!isBusy) requestClose()
  }

  const isAccepted = decision === 'accepted'
  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={confirm} variant="contained">{isBusy ? 'Đang xử lý…' : (isAccepted ? 'Chấp nhận' : 'Bác bỏ')}</Button>
        </>
      }
      error={error || requestError}
      onClose={closeIfIdle}
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
        placeholder={isAccepted ? 'Ví dụ: Bài viết chứa quảng cáo, đã ẩn theo quy định cộng đồng.' : 'Ví dụ: Đã xem xét, nội dung không vi phạm quy định.'}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        sx={{ mt: 2.5 }}
        value={note}
      />
    </DialogFrame>
    {discardDialog}
    </>
  )
}
