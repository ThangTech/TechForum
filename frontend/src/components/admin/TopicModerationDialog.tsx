import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useState } from 'react'
import type { ModerationAction } from '../../api/adminTopics'
import type { Category } from '../../api/categories'
import TextField from '@mui/material/TextField'

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
    <Dialog open onClose={() => close()} maxWidth={false} slotProps={{ paper: { 'aria-label': actionLabels[action], sx: { width: 480, maxWidth: 'calc(100% - 32px)' } } }}>
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">{actionLabels[action]}</h2>
        <p className="mt-2 text-sm text-slate-600">Hành động, người thực hiện, thời điểm và lý do sẽ được lưu vào nhật ký quản trị.</p>
        {action === 'move' && (
          <TextField
            className="mt-5"
            disabled={isBusy}
            id="moderation-category"
            label="Chuyên mục đích"
            onChange={(event) => setCategoryId(event.target.value)}
            select
            slotProps={{ inputLabel: { shrink: true }, select: { native: true } }}
            value={categoryId}
          >
            <option value="">Chọn chuyên mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </TextField>
        )}
        <TextField
          className="mt-5"
          disabled={isBusy}
          id="moderation-reason"
          label="Lý do"
          minRows={4}
          multiline
          onChange={(event) => setReason(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          value={reason}
        />
        {(validationError || requestError) && <p className="mt-3 text-sm text-red-700" role="alert">{validationError || requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isBusy} onClick={close} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={confirm} variant="contained">{isBusy ? 'Đang xử lý…' : 'Xác nhận'}</Button>
        </div>
      </div>
    </Dialog>
  )
}
