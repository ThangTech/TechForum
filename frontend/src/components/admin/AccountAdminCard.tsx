import { Button } from '@astryxdesign/core/Button'
import type { AdminAccount } from '../../api/adminAccounts'

interface AccountAdminCardProps {
  account: AdminAccount
  busyId: string | null
  onToggleLock: (account: AdminAccount) => void
}

export const AccountAdminCard = ({ account, busyId, onToggleLock }: AccountAdminCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-extrabold text-slate-950">{account.displayName}</h2>
        {account.isAdministrator && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Quản trị viên</span>}
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.isLocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {account.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{account.email}</p>
      <p className="mt-1 text-xs text-slate-500">Tham gia {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(account.createdAtUtc))}</p>
    </div>
    <div className="mt-4 sm:mt-0 sm:shrink-0">
      <Button
        isDisabled={busyId !== null || account.isAdministrator}
        isLoading={busyId === account.id}
        label={account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
        onClick={() => onToggleLock(account)}
        variant={account.isLocked ? 'primary' : 'secondary'}
      />
    </div>
  </article>
)
