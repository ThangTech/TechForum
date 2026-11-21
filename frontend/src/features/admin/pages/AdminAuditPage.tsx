import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { AdminPagination } from '../components/AdminPagination'
import { AuditLogList } from '../components/AuditLogList'
import { useAdminAuditPage } from '../hooks/useAdminAuditPage'
import { auditActionLabels } from '../utils/auditActionLabels'

export const AdminAuditPage = () => {
  const view = useAdminAuditPage()
  const { administrators, data } = view
  const { keyword, action, administratorId, from, to } = view.filters

  return (
    <section className="admin-page">
      <AdminPageHeading
        description="Đối chiếu người thực hiện, lý do và trạng thái trước / sau mỗi thao tác. Thời gian lọc theo giờ Việt Nam."
        eyebrow="Theo dõi quản trị"
        title="Nhật ký thao tác"
      />
      <form
        className="admin-toolbar"
        key={`${keyword}-${action}-${administratorId}-${from}-${to}`}
        onSubmit={view.submitFilters}
      >
        <TextField size="small" label="Tìm kiếm" defaultValue={keyword} name="keyword" placeholder="Tên quản trị viên, đối tượng hoặc lý do" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
        <TextField size="small" label="Quản trị viên" defaultValue={administratorId} name="administratorId" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả quản trị viên</option>
            {administratorId && !administrators.some((item) => item.id === administratorId) && (
              <option value={administratorId}>Quản trị viên được chọn</option>
            )}
            {administrators.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </TextField>
        <TextField size="small" label="Thao tác" defaultValue={action} name="action" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả thao tác</option>
            {Object.entries(auditActionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </TextField>
        <TextField size="small" label="Từ ngày" defaultValue={from} name="from" type="date" slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }} />
        <TextField size="small" label="Đến ngày" defaultValue={to} name="to" type="date" slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }} />
        <Button type="submit" variant="contained">Lọc nhật ký</Button>
        <Button onClick={view.clearFilters} variant="text">Xóa lọc</Button>
      </form>
      <AdminFeedback error={view.validationError} info={view.administratorError} />
      <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải nhật ký…" onRetry={view.retry} />
      {!view.isLoading && !view.error && data && (
        <>
          {data.items.length ? (
            <AuditLogList items={data.items} />
          ) : (
            <AdminEmptyState>Không có thao tác phù hợp với bộ lọc.</AdminEmptyState>
          )}
          <AdminPagination {...data} onChange={view.changePage} />
        </>
      )}
    </section>
  )
}
