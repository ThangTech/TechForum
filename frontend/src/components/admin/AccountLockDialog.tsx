import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useState, type FormEvent } from 'react'
import type { AdminAccount } from '../../api/adminAccounts'
import TextField from '@mui/material/TextField'

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
    <Dialog open onClose={() => !isBusy && onClose()} maxWidth={false} slotProps={{ paper: { 'aria-label': account.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản', sx: { width: 500, maxWidth: 'calc(100% - 32px)' } } }}>
      <form className="p-6" onSubmit={submit}>
        <h2 className="text-xl font-extrabold text-slate-950">
          {account.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {account.isLocked
            ? `Khôi phục quyền truy cập của ${account.displayName}.`
            : `Khóa quyền truy cập của ${account.displayName}. Phiên đăng nhập hiện tại sẽ mất hiệu lực ở yêu cầu tiếp theo.`}
        </p>
        {!account.isLocked && (
          <>
            <div className="mt-5 grid gap-4">
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
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Để trống nếu khóa vô thời hạn. Thời điểm theo giờ trên thiết bị của bạn.
            </p>
          </>
        )}
        {(validationError || requestError) && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {validationError || requestError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isBusy} onClick={onClose} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} type="submit" variant="contained">{account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
