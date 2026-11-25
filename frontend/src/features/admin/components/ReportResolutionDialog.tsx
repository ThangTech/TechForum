import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { DialogFrame } from '../../../shared/feedback/DialogFrame'
import { useDiscardGuard } from '../../../shared/feedback/useDiscardGuard'
import type { AdminReport } from '../../reports/types/reports'

interface ReportResolutionDialogProps {
  decision: 'accepted' | 'rejected' | null
  report: AdminReport | null
  requestError: string | null
  isBusy: boolean
  onClose: () => void
  onConfirm: (note: string) => void
}

export const ReportResolutionDialog = ({
  decision,
  report,
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
  const count = Math.max(1, report?.pendingCount ?? 1)
  const kind = report?.targetType === 'answer' ? 'Câu trả lời' : 'Nội dung'
  // Nói rõ hệ quả trước khi bấm, để không ai tưởng đã xử lý mà nội dung vẫn còn hiện.
  const consequence = isAccepted
    ? `${kind} "${report?.targetTitle ?? ''}" sẽ bị ẩn khỏi trang công khai, tác giả nhận thông báo kèm lý do.`
    : report?.isTargetAutoHidden
      ? `${kind} đang tạm ẩn vì nhiều báo cáo sẽ được hiện lại.`
      : `${kind} được giữ nguyên.`
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
      <Typography sx={{ lineHeight: '1.5rem' }} variant="body2">{consequence}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">
        {count > 1
          ? `Cả ${count} báo cáo về nội dung này được xử lý cùng lúc; mỗi người báo cáo nhận kết quả và lý do.`
          : 'Người báo cáo nhận kết quả và lý do.'}{' '}
        Quyết định được ghi vào nhật ký quản trị.
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
