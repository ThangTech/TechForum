import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState } from 'react'
import type { ModerationAction } from '../../api/adminTopics'
import type { Category } from '../../api/categories'

interface TopicModerationDialogProps {
  action: ModerationAction
  categories: Category[]
  isBusy: boolean
  onClose: () => void
  onConfirm: (reason: string, categoryId?: number) => void
  requestError: string | null
}

const actionLabels: Record<ModerationAction, string> = {
  hide: 'Ẩn nội dung', restore: 'Khôi phục nội dung', lock: 'Khóa thảo luận', unlock: 'Mở thảo luận',
  pin: 'Ghim nội dung', unpin: 'Bỏ ghim', move: 'Chuyển chuyên mục',
}

export const TopicModerationDialog = ({ action, categories, isBusy, onClose, onConfirm, requestError }: TopicModerationDialogProps) => {
  const [reason, setReason] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const close = () => { if (!isBusy) onClose() }
  const confirm = () => {
    if (!reason.trim()) { setValidationError('Vui lòng ghi lý do kiểm duyệt.'); return }
    if (action === 'move' && !categoryId) { setValidationError('Vui lòng chọn chuyên mục đích.'); return }
    onConfirm(reason.trim(), categoryId ? Number(categoryId) : undefined)
  }
  return (
    <Dialog aria-label={actionLabels[action]} isOpen onOpenChange={(open) => !open && close()} padding={0} purpose="required" width={480}>
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">{actionLabels[action]}</h2>
        <p className="mt-2 text-sm text-slate-600">Hành động, người thực hiện, thời điểm và lý do sẽ được lưu vào nhật ký quản trị.</p>
        {action === 'move' && (
          <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-800" htmlFor="moderation-category">
            Chuyên mục đích
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" disabled={isBusy} id="moderation-category" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
              <option value="">Chọn chuyên mục</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        )}
        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-800" htmlFor="moderation-reason">
          Lý do
          <textarea className="min-h-28 resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200" disabled={isBusy} id="moderation-reason" maxLength={1000} onChange={(event) => setReason(event.target.value)} value={reason} />
        </label>
        {(validationError || requestError) && <p className="mt-3 text-sm text-red-700" role="alert">{validationError || requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button isDisabled={isBusy} label="Hủy" onClick={close} variant="secondary" />
          <Button isDisabled={isBusy} isLoading={isBusy} label={isBusy ? 'Đang xử lý…' : 'Xác nhận'} onClick={confirm} variant="primary" />
        </div>
      </div>
    </Dialog>
  )
}
