import { Link } from 'react-router-dom'
import type { AdminAccount } from '../../api/adminAccounts'
import { appRoutes } from '../../appRoutes'

export const AccountAdminCard = ({
  account,
  busyId,
  onToggleLock,
}: {
  account: AdminAccount
  busyId: string | null
  onToggleLock: (account: AdminAccount) => void
}) => (
  <tr>
    <td>
      <Link className="admin-table-primary" to={appRoutes.member(account.id)}>
        {account.displayName}
      </Link>
      <span className="admin-table-secondary">{account.email}</span>
    </td>
    <td>
      <span className={`admin-badge ${account.isAdministrator ? 'admin-badge-blue' : ''}`}>
        {account.isAdministrator ? 'Quản trị viên' : 'Thành viên'}
      </span>
    </td>
    <td>
      <span className={`admin-badge ${account.isLocked ? 'admin-badge-red' : 'admin-badge-green'}`}>
        {account.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}
      </span>
      {account.isLocked && (
        <>
          <span className="admin-table-secondary">
            {account.lockoutEndUtc
              ? `Đến ${new Date(account.lockoutEndUtc).toLocaleString('vi-VN')}`
              : 'Vô thời hạn'}
          </span>
          {account.lockReason && <p className="mt-1 max-w-64 break-words text-xs">{account.lockReason}</p>}
        </>
      )}
    </td>
    <td className="whitespace-nowrap">{new Date(account.createdAtUtc).toLocaleDateString('vi-VN')}</td>
    <td>
      <div className="admin-table-actions">
        <button
          disabled={busyId !== null || account.isAdministrator}
          onClick={() => onToggleLock(account)}
          type="button"
        >
          {busyId === account.id ? 'Đang xử lý…' : account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
        </button>
      </div>
      {account.isAdministrator && <span className="admin-table-secondary">Bảo vệ tài khoản quản trị</span>}
    </td>
  </tr>
)
