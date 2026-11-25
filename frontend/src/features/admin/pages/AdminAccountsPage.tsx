import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { AccountAdminCard } from '../components/AccountAdminCard'
import { AccountRoleDialog } from '../components/AccountRoleDialog'
import { AccountLockDialog } from '../components/AccountLockDialog'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { AdminPagination } from '../components/AdminPagination'
import { ACCOUNT_FILTER_KEYS, useAdminAccountsPage } from '../hooks/useAdminAccountsPage'

export const AdminAccountsPage = () => {
  const view = useAdminAccountsPage()
  const { data, filters, lock } = view

  return (
    <section className="admin-page">
      <AdminPageHeading
        description="Tra cứu thành viên, mức hoạt động và vi phạm; khóa tài khoản hoặc cấp quyền quản trị. Tài khoản quản trị được bảo vệ khỏi thao tác khóa."
        eyebrow="Quản trị thành viên"
        title="Tài khoản"
      />
      <form className="admin-toolbar" key={`${filters.keyword}-${filters.status}-${filters.role}`} onSubmit={(event) => view.submitFilters(event, ACCOUNT_FILTER_KEYS)} role="search">
        <TextField size="small" label="Tìm tài khoản" defaultValue={filters.keyword} name="keyword" placeholder="Tên hoặc email thành viên" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
        <TextField size="small" label="Trạng thái" defaultValue={filters.status} name="status" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="unlocked">Đang hoạt động</option>
            <option value="locked">Đang bị khóa</option>
            <option value="unverified">Chưa xác minh email</option>
          </TextField>
        <TextField size="small" label="Vai trò" defaultValue={filters.role} name="role" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả vai trò</option>
            <option value="member">Thành viên</option>
            <option value="administrator">Quản trị viên</option>
          </TextField>
        <Button type="submit" variant="contained">Tìm kiếm</Button>
        <Button onClick={view.clearFilters} variant="text">Xóa lọc</Button>
      </form>
      <AdminFeedback error={view.feedback.error} success={view.feedback.success} />
      <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải tài khoản…" onRetry={view.retry} />
      {!view.isLoading && !view.error && data && (
        <>
          {data.items.length ? (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách tài khoản TechForum</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Thành viên</TableCell>
                    <TableCell>Hoạt động</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tham gia</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((account) => (
                    <AccountAdminCard
                      account={account}
                      busyId={view.busyId}
                      currentUserId={view.currentUserId}
                      key={account.id}
                      onChangeRole={view.roleChange.open}
                      onToggleLock={lock.open}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <AdminEmptyState>Không tìm thấy tài khoản phù hợp.</AdminEmptyState>
          )}
          <AdminPagination {...data} onChange={view.changePage} />
        </>
      )}
      {view.roleChange.account && (
        <AccountRoleDialog
          account={view.roleChange.account}
          isBusy={view.roleChange.isBusy}
          key={`role-${view.roleChange.account.id}`}
          onClose={view.roleChange.close}
          onConfirm={(reason) => void view.roleChange.confirm(reason)}
          requestError={view.roleChange.error}
        />
      )}
      {lock.account && (
        <AccountLockDialog
          account={lock.account}
          isBusy={lock.isBusy}
          key={lock.account.id}
          onClose={lock.close}
          onConfirm={(reason, until) => void lock.confirm(reason, until)}
          requestError={lock.error}
        />
      )}
    </section>
  )
}
