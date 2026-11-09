import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { ModerationAction } from '../../api/adminTopics'
import type { Category } from '../../api/categories'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'

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

// An example of a good reason for each action, shown in the empty box.
const reasonExamples: Record<ModerationAction, string> = {
  hide: 'Ví dụ: Bài viết chứa quảng cáo, vi phạm quy định cộng đồng.',
  restore: 'Ví dụ: Đã kiểm tra lại, nội dung không vi phạm.',
  lock: 'Ví dụ: Thảo luận có nhiều bình luận công kích cá nhân.',
  unlock: 'Ví dụ: Tình hình đã ổn định, mở lại thảo luận.',
  pin: 'Ví dụ: Bài hướng dẫn hữu ích cho thành viên mới.',
  unpin: 'Ví dụ: Nội dung đã cũ, không cần ghim nữa.',
  move: 'Ví dụ: Bài viết thuộc chủ đề Web, chuyển cho đúng chuyên mục.',
}

export const TopicModerationDialog = ({ action, categories, isBusy, onClose, onConfirm, requestError }: TopicModerationDialogProps) => {
  const [reason, setReason] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const close = () => { if (!isBusy) onClose() }
  const { requestClose, discardDialog } = useDiscardGuard(reason.trim() !== '' || categoryId !== '', close)
  const closeIfIdle = () => { if (!isBusy) requestClose() }
  const confirm = () => {
    if (!reason.trim()) { setValidationError('Vui lòng ghi lý do kiểm duyệt.'); return }
    if (action === 'move' && !categoryId) { setValidationError('Vui lòng chọn chuyên mục đích.'); return }
    onConfirm(reason.trim(), categoryId ? Number(categoryId) : undefined)
  }
  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={confirm} variant="contained">{isBusy ? 'Đang xử lý…' : 'Xác nhận'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={closeIfIdle}
      title={actionLabels[action]}
    >
      <Typography color="text.secondary" variant="body2">Hành động, người thực hiện, thời điểm và lý do sẽ được lưu vào nhật ký quản trị.</Typography>
      <Stack spacing={2.5} sx={{ mt: 2.5 }}>
        {action === 'move' && (
          <TextField
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
          disabled={isBusy}
          id="moderation-reason"
          label="Lý do"
          minRows={4}
          multiline
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonExamples[action]}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          value={reason}
        />
      </Stack>
    </DialogFrame>
    {discardDialog}
    </>
  )
}
