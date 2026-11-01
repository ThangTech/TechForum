import { Link } from 'react-router-dom'
import type { AdminAccount } from '../../api/adminAccounts'
import { appRoutes } from '../../appRoutes'
import { StatusBadge } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

export const AccountAdminCard = ({
  account,
  busyId,
  onToggleLock,
}: {
  account: AdminAccount
  busyId: string | null
  onToggleLock: (account: AdminAccount) => void
}) => (
  <TableRow>
    <TableCell>
      <Link className="admin-table-primary" to={appRoutes.member(account.id)}>
        {account.displayName}
      </Link>
      <span className="admin-table-secondary">{account.email}</span>
    </TableCell>
    <TableCell>
      <StatusBadge tone={account.isAdministrator ? 'blue' : 'neutral'}>
        {account.isAdministrator ? 'Quản trị viên' : 'Thành viên'}
      </StatusBadge>
    </TableCell>
    <TableCell>
      <StatusBadge tone={account.isLocked ? 'red' : 'green'}>
        {account.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}
      </StatusBadge>
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
    </TableCell>
    <TableCell className="whitespace-nowrap">{new Date(account.createdAtUtc).toLocaleDateString('vi-VN')}</TableCell>
    <TableCell>
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
    </TableCell>
  </TableRow>
)
