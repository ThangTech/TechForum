import { Link } from 'react-router-dom'
import type { AdminAccount } from '../types/adminAccounts'
import { appRoutes } from '../../../app/appRoutes'
import { StatusBadge } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableRow from '@mui/material/TableRow'

export const AccountAdminCard = ({
  account,
  busyId,
  currentUserId,
  onToggleLock,
  onChangeRole,
}: {
  account: AdminAccount
  busyId: string | null
  currentUserId: string | null
  onToggleLock: (account: AdminAccount) => void
  onChangeRole: (account: AdminAccount) => void
}) => (
  <TableRow>
    <TableCell>
      <Link className="admin-table-primary" to={appRoutes.member(account.id)}>
        {account.displayName}
      </Link>
      <span className="admin-table-secondary">{account.email}</span>
      {!account.emailConfirmed && <StatusBadge tone="amber">Chưa xác minh email</StatusBadge>}
    </TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      {account.topicCount} bài · {account.answerCount} trả lời
      {account.violationCount > 0 && (
        <span className="admin-table-secondary" style={{ color: 'var(--color-danger, #b91c1c)' }}>
          {account.violationCount} lần vi phạm
        </span>
      )}
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
          {account.lockReason && <Typography sx={{ mt: 0.5, maxWidth: 256, overflowWrap: 'break-word', fontSize: '0.75rem' }}>{account.lockReason}</Typography>}
        </>
      )}
    </TableCell>
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(account.createdAtUtc).toLocaleDateString('vi-VN')}</TableCell>
    <TableCell>
      <div className="admin-table-actions">
        {!account.isAdministrator && (
          <button disabled={busyId !== null} onClick={() => onToggleLock(account)} type="button">
            {busyId === account.id ? 'Đang xử lý…' : account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
          </button>
        )}
        {account.id !== currentUserId && (account.isAdministrator || (account.emailConfirmed && !account.isLocked)) && (
          <button disabled={busyId !== null} onClick={() => onChangeRole(account)} type="button">
            {account.isAdministrator ? 'Thu quyền quản trị' : 'Cấp quyền quản trị'}
          </button>
        )}
      </div>
      {account.id === currentUserId && <span className="admin-table-secondary">Tài khoản của bạn</span>}
    </TableCell>
  </TableRow>
)
