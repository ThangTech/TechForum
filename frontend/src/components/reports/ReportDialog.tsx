import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useState } from 'react'
import { createReport, type ReportReason, type ReportTargetType } from '../../api/reports'
import { ApiError } from '../../api/client'

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

  return (
    <Dialog open={isOpen} onClose={() => close()} maxWidth={false} slotProps={{ paper: { 'aria-label': "Báo cáo nội dung", sx: { width: 480, maxWidth: 'calc(100% - 32px)' } } }}>
      <div className="p-6">
        {isSubmitted ? (
          <>
            <h2 className="text-xl font-extrabold text-slate-950">Đã gửi báo cáo</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Báo cáo đang chờ quản trị viên xem xét. Cảm ơn bạn đã giúp giữ cộng đồng an toàn.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={close} variant="contained">Đóng</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-slate-950">Báo cáo nội dung</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Chọn lý do phù hợp. Mỗi báo cáo sẽ được quản trị viên xem xét trước khi xử lý.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor={`report-reason-${targetType}-${targetId}`}>
                Lý do
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isSubmitting}
                  id={`report-reason-${targetType}-${targetId}`}
                  onChange={(event) => setReason(event.target.value as ReportReason)}
                  value={reason}
                >
                  {reasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor={`report-details-${targetType}-${targetId}`}>
                Mô tả {reason === 'other' ? '(bắt buộc)' : '(không bắt buộc)'}
                <textarea
                  className="min-h-28 resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isSubmitting}
                  id={`report-details-${targetType}-${targetId}`}
                  maxLength={1000}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Cung cấp thông tin giúp quản trị viên xác minh báo cáo"
                  value={details}
                />
                <span className="text-right text-xs font-normal text-slate-500">{details.length}/1.000</span>
              </label>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button disabled={isSubmitting} onClick={close} variant="outlined">Hủy</Button>
              <Button disabled={isSubmitting} loading={isSubmitting} onClick={() => void submit()} variant="contained">{isSubmitting ? 'Đang gửi…' : 'Gửi báo cáo'}</Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
