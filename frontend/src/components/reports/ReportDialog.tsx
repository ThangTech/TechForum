import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { createReport, type ReportReason, type ReportTargetType } from '../../api/reports'
import { ApiError } from '../../api/client'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetId: number
  targetType: ReportTargetType
}

const reasonOptions: { label: string; value: ReportReason }[] = [
  { value: 'spam', label: 'Spam hoặc quảng cáo' },
  { value: 'harassment', label: 'Quấy rối hoặc công kích' },
  { value: 'misinformation', label: 'Thông tin sai lệch' },
  { value: 'copyright', label: 'Vi phạm bản quyền' },
  { value: 'other', label: 'Lý do khác' },
]

export const ReportDialog = ({ isOpen, onClose, targetId, targetType }: ReportDialogProps) => {
  const [reason, setReason] = useState<ReportReason>('spam')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const close = () => {
    if (isSubmitting) return
    setReason('spam')
    setDetails('')
    setError(null)
    setIsSubmitted(false)
    onClose()
  }

  const { requestClose, discardDialog } = useDiscardGuard(reason !== 'spam' || details.trim() !== '', close)
  const closeIfIdle = () => {
    if (!isSubmitting) requestClose()
  }

  const submit = async () => {
    const normalizedDetails = details.trim()
    if (reason === 'other' && !normalizedDetails) {
      setError('Vui lòng mô tả lý do khác.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: normalizedDetails || null,
      })
      setIsSubmitted(true)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể gửi báo cáo lúc này.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <DialogFrame
        actions={<Button onClick={close} variant="contained">Đóng</Button>}
        closeOnBackdropClick
        onClose={close}
        open={isOpen}
        title="Đã gửi báo cáo"
      >
        <Typography color="text.secondary" sx={{ lineHeight: '1.5rem' }} variant="body2">
          Báo cáo đang chờ quản trị viên xem xét. Cảm ơn bạn đã giúp giữ cộng đồng an toàn.
        </Typography>
      </DialogFrame>
    )
  }

  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isSubmitting} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={isSubmitting} loading={isSubmitting} onClick={() => void submit()} variant="contained">{isSubmitting ? 'Đang gửi…' : 'Gửi báo cáo'}</Button>
        </>
      }
      error={error}
      onClose={closeIfIdle}
      open={isOpen}
      title="Báo cáo nội dung"
    >
      <Typography color="text.secondary" sx={{ lineHeight: '1.5rem' }} variant="body2">
        Chọn lý do phù hợp. Mỗi báo cáo sẽ được quản trị viên xem xét trước khi xử lý.
      </Typography>
      <Stack spacing={2} sx={{ mt: 2.5 }}>
        <TextField
          disabled={isSubmitting}
          id={`report-reason-${targetType}-${targetId}`}
          label="Lý do"
          onChange={(event) => setReason(event.target.value as ReportReason)}
          select
          value={reason}
        >
          {reasonOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          disabled={isSubmitting}
          helperText={`${details.length}/1.000`}
          id={`report-details-${targetType}-${targetId}`}
          label={`Mô tả ${reason === 'other' ? '(bắt buộc)' : '(không bắt buộc)'}`}
          minRows={4}
          multiline
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Cung cấp thông tin giúp quản trị viên xác minh báo cáo"
          slotProps={{ formHelperText: { sx: { textAlign: 'right' } }, htmlInput: { maxLength: 1000 }, inputLabel: { shrink: true } }}
          value={details}
        />
      </Stack>
    </DialogFrame>
    {discardDialog}
    </>
  )
}
