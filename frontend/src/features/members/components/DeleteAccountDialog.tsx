import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { DialogFrame } from '../../../shared/feedback/DialogFrame'
import { getActionError } from '../../../shared/hooks/useActionFeedback'

// Xoá tài khoản: nói rõ cái gì mất, cái gì còn, rồi bắt gõ "XÓA" (và mật khẩu) để không bấm nhầm.
export const DeleteAccountDialog = ({ hasPassword, onClose, onConfirm }: {
  hasPassword: boolean
  onClose: () => void
  onConfirm: (password: string | null, confirmation: string) => Promise<void>
}) => {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const canSubmit = confirmation.trim() === 'XÓA' && (!hasPassword || password !== '')

  const submit = async () => {
    if (!canSubmit || isBusy) return
    setIsBusy(true)
    setError(null)
    try {
      await onConfirm(hasPassword ? password : null, confirmation.trim())
    } catch (requestError) {
      setError(getActionError(requestError, 'Không thể xóa tài khoản lúc này.'))
      setIsBusy(false)
    }
  }

  return (
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={onClose} variant="outlined">Hủy</Button>
          <Button color="error" disabled={!canSubmit} loading={isBusy} onClick={() => void submit()} variant="contained">Xóa vĩnh viễn</Button>
        </>
      }
      error={error}
      onClose={() => { if (!isBusy) onClose() }}
      open
      title="Xóa tài khoản?"
    >
      <Typography sx={{ lineHeight: '1.6rem' }} variant="body2">
        Email, tên, ảnh đại diện, giới thiệu, kỹ năng, bài đã lưu, người theo dõi, thông báo và bản nháp sẽ bị xóa,
        và bạn không đăng nhập lại được. Việc này không hoàn tác được.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.6rem' }} variant="body2">
        Bài viết và câu trả lời đã đăng vẫn được giữ để thảo luận của người khác không bị đứt đoạn, nhưng hiện là
        "Người dùng đã xóa". Muốn gỡ một bài, hãy xóa bài đó trước.
      </Typography>
      {hasPassword && (
        <TextField
          autoComplete="current-password"
          disabled={isBusy}
          fullWidth
          label="Mật khẩu hiện tại"
          onChange={(event) => setPassword(event.target.value)}
          sx={{ mt: 2.5 }}
          type="password"
          value={password}
        />
      )}
      <TextField
        disabled={isBusy}
        fullWidth
        helperText="Gõ XÓA (chữ in hoa, có dấu) để xác nhận."
        label="Xác nhận"
        onChange={(event) => setConfirmation(event.target.value)}
        sx={{ mt: 2 }}
        value={confirmation}
      />
    </DialogFrame>
  )
}
