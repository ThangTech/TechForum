import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState } from 'react'

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
    <Dialog
      aria-label={isAccepted ? 'Chấp nhận báo cáo' : 'Bác bỏ báo cáo'}
      isOpen={decision !== null}
      onOpenChange={(open) => !open && close()}
      padding={0}
      purpose="required"
      width={480}
    >
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">
          {isAccepted ? 'Chấp nhận báo cáo' : 'Bác bỏ báo cáo'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Quyết định được lưu cùng tài khoản và thời điểm xử lý để phục vụ nhật ký quản trị.
        </p>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-800" htmlFor="resolution-note">
          Lý do xử lý
          <textarea
            className="min-h-28 resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={isBusy}
            id="resolution-note"
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
          <span className="text-right text-xs font-normal text-slate-500">{note.length}/1.000</span>
        </label>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        {requestError && <p className="mt-3 text-sm text-red-700" role="alert">{requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button isDisabled={isBusy} label="Hủy" onClick={close} variant="secondary" />
          <Button
            isDisabled={isBusy}
            isLoading={isBusy}
            label={isBusy ? 'Đang xử lý…' : (isAccepted ? 'Chấp nhận' : 'Bác bỏ')}
            onClick={confirm}
            variant="primary"
          />
        </div>
      </div>
    </Dialog>
  )
}
