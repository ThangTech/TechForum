import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import type { AdminAccount } from '../types/adminAccounts'
import { DialogFrame } from '../../../shared/feedback/DialogFrame'
import { useDiscardGuard } from '../../../shared/feedback/useDiscardGuard'

// Các mức khoá hay dùng; vẫn chọn được ngày giờ cụ thể ở ô bên dưới.
const lockPresets = [
  { label: '1 ngày', days: 1 },
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: 'Vô thời hạn', days: 0 },
]

// Giá trị cho ô datetime-local theo giờ trên máy (không có múi giờ).
const toLocalInput = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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
  const [until, setUntil] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const close = () => {
    if (!isBusy) onClose()
  }
  const { requestClose, discardDialog } = useDiscardGuard(reason.trim() !== '' || until !== '', close)
  const closeIfIdle = () => {
    if (!isBusy) requestClose()
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy) return
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
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          {/* The button is outside the form, so the "form" attribute connects it to the form. */}
          <Button disabled={isBusy} form="account-lock-form" loading={isBusy} type="submit" variant="contained">{account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={closeIfIdle}
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
                placeholder="Ví dụ: Đăng nội dung spam nhiều lần dù đã được nhắc nhở."
                required
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                value={reason}
              />
              <Stack aria-label="Chọn nhanh thời hạn" direction="row" role="group" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {lockPresets.map((preset) => (
                  <Button disabled={isBusy} key={preset.label} onClick={() => setUntil(preset.days ? toLocalInput(preset.days) : '')} size="small" variant="outlined">
                    {preset.label}
                  </Button>
                ))}
              </Stack>
              <TextField
                disabled={isBusy}
                id="account-lock-until"
                label="Khóa đến thời điểm"
                name="lockoutEnd"
                onChange={(event) => setUntil(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                type="datetime-local"
                value={until}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
              Để trống nếu khóa vô thời hạn. Thời điểm theo giờ trên thiết bị của bạn.
            </Typography>
          </>
        )}
      </form>
    </DialogFrame>
    {discardDialog}
    </>
  )
}
