import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import type { AdminAccount } from '../../api/adminAccounts'
import { DialogFrame } from '../feedback/DialogFrame'

export const AccountLockDialog = ({
  account,
  isBusy,
  requestError,
  onClose,
  onConfirm,
}: {
  account: AdminAccount
  isBusy: boolean
  requestError: string | null
  onClose: () => void
  onConfirm: (reason: string | null, lockoutEndUtc: string | null) => void
}) => {
  const [reason, setReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy) return
    const fields = new FormData(event.currentTarget)
    const until = String(fields.get('lockoutEnd') ?? '')
    if (!account.isLocked && !reason.trim()) {
      setValidationError('Vui lòng ghi lý do khóa tài khoản.')
      return
    }
    if (
      !account.isLocked &&
      until &&
      (!Number.isFinite(new Date(until).getTime()) || new Date(until).getTime() <= Date.now())
    ) {
      setValidationError('Thời hạn khóa phải ở tương lai.')
      return
    }
    setValidationError(null)
    onConfirm(
      account.isLocked ? null : reason.trim(),
      account.isLocked || !until ? null : new Date(until).toISOString(),
    )
  }
  return (
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={onClose} variant="outlined">Hủy</Button>
          {/* The button is outside the form, so the "form" attribute connects it to the form. */}
          <Button disabled={isBusy} form="account-lock-form" loading={isBusy} type="submit" variant="contained">{account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={() => !isBusy && onClose()}
      title={account.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
      width={500}
    >
      <form id="account-lock-form" onSubmit={submit}>
        <Typography color="text.secondary" sx={{ lineHeight: '1.5rem' }} variant="body2">
          {account.isLocked
            ? `Khôi phục quyền truy cập của ${account.displayName}.`
            : `Khóa quyền truy cập của ${account.displayName}. Phiên đăng nhập hiện tại sẽ mất hiệu lực ở yêu cầu tiếp theo.`}
        </Typography>
        {!account.isLocked && (
          <>
            <Stack spacing={2} sx={{ mt: 2.5 }}>
              <TextField
                disabled={isBusy}
                id="account-lock-reason"
                label="Lý do khóa"
                minRows={4}
                multiline
                onChange={(event) => setReason(event.target.value)}
                required
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                value={reason}
              />
              <TextField
                disabled={isBusy}
                id="account-lock-until"
                label="Khóa đến thời điểm"
                name="lockoutEnd"
                slotProps={{ inputLabel: { shrink: true } }}
                type="datetime-local"
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
              Để trống nếu khóa vô thời hạn. Thời điểm theo giờ trên thiết bị của bạn.
            </Typography>
          </>
        )}
      </form>
    </DialogFrame>
  )
}
