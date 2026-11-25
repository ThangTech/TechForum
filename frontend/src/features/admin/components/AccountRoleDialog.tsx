import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { DialogFrame } from '../../../shared/feedback/DialogFrame'
import type { AdminAccount } from '../types/adminAccounts'

// Cấp hoặc thu quyền quản trị: bắt buộc ghi lý do, vì đây là thao tác trao quyền kiểm duyệt cả diễn đàn.
export const AccountRoleDialog = ({ account, isBusy, requestError, onClose, onConfirm }: {
  account: AdminAccount
  isBusy: boolean
  requestError: string | null
  onClose: () => void
  onConfirm: (reason: string) => void
}) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const granting = !account.isAdministrator
  const confirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng ghi lý do.')
      return
    }
    onConfirm(reason.trim())
  }
  return (
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={onClose} variant="outlined">Hủy</Button>
          <Button color={granting ? 'primary' : 'error'} loading={isBusy} onClick={confirm} variant="contained">
            {granting ? 'Cấp quyền' : 'Thu quyền'}
          </Button>
        </>
      }
      error={error || requestError}
      onClose={() => { if (!isBusy) onClose() }}
      open
      title={granting ? 'Cấp quyền quản trị' : 'Thu quyền quản trị'}
    >
      <Typography sx={{ lineHeight: '1.5rem' }} variant="body2">
        {granting
          ? `${account.displayName} sẽ vào được khu quản trị: ẩn nội dung, xử lý báo cáo, khóa tài khoản và đổi cấu hình diễn đàn.`
          : `${account.displayName} sẽ trở lại quyền thành viên và không vào được khu quản trị nữa.`}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">
        Thay đổi có hiệu lực ngay, người đó nhận thông báo kèm lý do và thao tác được ghi vào nhật ký.
      </Typography>
      <TextField
        disabled={isBusy}
        fullWidth
        label="Lý do"
        minRows={3}
        multiline
        onChange={(event) => setReason(event.target.value)}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        sx={{ mt: 2.5 }}
        value={reason}
      />
    </DialogFrame>
  )
}
