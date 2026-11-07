import Button from '@mui/material/Button'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminPagination } from '../components/admin/AdminPagination'
import { AuditLogList } from '../components/admin/AuditLogList'
import { auditActionLabels } from '../components/admin/auditActionLabels'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { useAdminAuditLogs, useAdministrators } from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import TextField from '@mui/material/TextField'

export const AdminAuditPage = () => {
  const [params, setParams] = useSearchParams()
  const pageValue = Number(params.get('page'))
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const keyword = params.get('keyword') ?? ''
  const action = params.get('action') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const administratorId = params.get('administratorId') ?? ''
  const [validationError, setValidationError] = useState<string | null>(null)

  const administratorsQuery = useAdministrators()
  const auditQuery = useAdminAuditLogs({ page, pageSize: 15, keyword, action, administratorId, from, to })
  const administrators = administratorsQuery.data ?? []
  const administratorError = administratorsQuery.error
    ? 'Không thể tải bộ lọc quản trị viên. Bạn vẫn có thể tìm theo tên trong ô tìm kiếm.'
    : null
  const data = auditQuery.data ?? null
  const isLoading = isInitialLoading(auditQuery)
  const error = getErrorMessage(auditQuery.error, 'Không thể tải nhật ký quản trị.')

  const retry = () => {
    if (administratorsQuery.error) void administratorsQuery.refetch()
    void auditQuery.refetch()
  }
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['keyword', 'action', 'administratorId', 'from', 'to']) {
      const value = String(fields.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    if (next.get('from') && next.get('to') && String(next.get('from')) > String(next.get('to'))) {
      setValidationError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
      return
    }
    setValidationError(null)
    setParams(next)
  }
  const changePage = (value: number) => {
    const next = new URLSearchParams(params)
    if (value > 1) next.set('page', String(value))
    else next.delete('page')
    setParams(next)
  }
  return (
    <section className="admin-page">
      <p className="eyebrow">Theo dõi quản trị</p>
      <h1 className="font-extrabold">Nhật ký thao tác</h1>
      <p className="admin-page-description">
        Đối chiếu người thực hiện, lý do và trạng thái trước / sau mỗi thao tác. Thời gian lọc theo giờ Việt
        Nam.
      </p>
      <form
        className="admin-toolbar"
        key={`${keyword}-${action}-${administratorId}-${from}-${to}`}
        onSubmit={filter}
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
        <Button
          onClick={() => {
            setParams({})
            setValidationError(null)
          }}
          variant="text"
        >
          Xóa lọc
        </Button>
      </form>
      {administratorError && (
        <p className="admin-message" role="status">
          {administratorError}
        </p>
      )}
      {validationError && (
        <p className="admin-message admin-message-error" role="alert">
          {validationError}
        </p>
      )}
      <AsyncStatePanel
        error={error}
        isLoading={isLoading}
        loadingText="Đang tải nhật ký…"
        onRetry={retry}
      />
      {!isLoading && !error && data && (
        <>
          {data.items.length ? (
            <AuditLogList items={data.items} />
          ) : (
            <p className="admin-empty">Không có thao tác phù hợp với bộ lọc.</p>
          )}
          <AdminPagination {...data} onChange={changePage} />
        </>
      )}
    </section>
  )
}
