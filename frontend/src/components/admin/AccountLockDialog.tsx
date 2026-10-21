import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState, type FormEvent } from 'react'
import type { AdminAccount } from '../../api/adminAccounts'

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
    <Dialog
      aria-label={account.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
      isOpen
      onOpenChange={(open) => !open && !isBusy && onClose()}
      padding={0}
      purpose="required"
      width={500}
    >
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
            <label className="mt-5 grid gap-2 text-sm font-semibold" htmlFor="account-lock-reason">
              Lý do khóa
              <textarea
                className="min-h-28 rounded border border-slate-300 px-3 py-2 font-normal"
                disabled={isBusy}
                id="account-lock-reason"
                maxLength={1000}
                onChange={(event) => setReason(event.target.value)}
                required
                value={reason}
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-semibold" htmlFor="account-lock-until">
              Khóa đến thời điểm
              <input
                className="rounded border border-slate-300 px-3 py-2 font-normal"
                disabled={isBusy}
                id="account-lock-until"
                name="lockoutEnd"
                type="datetime-local"
              />
            </label>
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
          <Button isDisabled={isBusy} label="Hủy" onClick={onClose} variant="secondary" />
          <Button
            isDisabled={isBusy}
            isLoading={isBusy}
            label={account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
            type="submit"
            variant="primary"
          />
        </div>
      </form>
    </Dialog>
  )
}
