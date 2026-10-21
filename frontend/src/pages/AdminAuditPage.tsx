import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminAuditLogs, type AdminAuditPage as AuditPageData } from '../api/adminOverview'
import { getAdminAccounts, type AdminAccount } from '../api/adminAccounts'
import { ApiError } from '../api/client'
import { AdminPagination } from '../components/admin/AdminPagination'
import { AuditLogList } from '../components/admin/AuditLogList'
import { auditActionLabels } from '../components/admin/auditActionLabels'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

export const AdminAuditPage = () => {
  const [params, setParams] = useSearchParams()
  const pageValue = Number(params.get('page'))
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const keyword = params.get('keyword') ?? ''
  const action = params.get('action') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const administratorId = params.get('administratorId') ?? ''
  const [administrators, setAdministrators] = useState<AdminAccount[]>([])
  const [administratorError, setAdministratorError] = useState<string | null>(null)
  const [data, setData] = useState<AuditPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const loadAdministrators = async () => {
      setAdministratorError(null)
      try {
        const first = await getAdminAccounts('', 1, 50, controller.signal, '', 'administrator')
        const items = [...first.items]
        for (let nextPage = 2; nextPage <= first.totalPages; nextPage += 1) {
          const result = await getAdminAccounts('', nextPage, 50, controller.signal, '', 'administrator')
          items.push(...result.items)
        }
        if (!controller.signal.aborted) setAdministrators(items)
      } catch {
        if (!controller.signal.aborted)
          setAdministratorError(
            'Không thể tải bộ lọc quản trị viên. Bạn vẫn có thể tìm theo tên trong ô tìm kiếm.',
          )
      }
    }
    void loadAdministrators()
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(
          await getAdminAuditLogs(
            { page, pageSize: 15, keyword, action, administratorId, from, to },
            controller.signal,
          ),
        )
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải nhật ký quản trị.',
          )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [page, keyword, action, administratorId, from, to, retry])
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
        <label className="admin-field admin-search-field">
          Tìm kiếm
          <input
            defaultValue={keyword}
            maxLength={100}
            name="keyword"
            placeholder="Tên quản trị viên, đối tượng hoặc lý do"
          />
        </label>
        <label className="admin-field">
          Quản trị viên
          <select defaultValue={administratorId} name="administratorId">
            <option value="">Tất cả quản trị viên</option>
            {administratorId && !administrators.some((item) => item.id === administratorId) && (
              <option value={administratorId}>Quản trị viên được chọn</option>
            )}
            {administrators.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Thao tác
          <select defaultValue={action} name="action">
            <option value="">Tất cả thao tác</option>
            {Object.entries(auditActionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Từ ngày
          <input defaultValue={from} name="from" type="date" />
        </label>
        <label className="admin-field">
          Đến ngày
          <input defaultValue={to} name="to" type="date" />
        </label>
        <Button label="Lọc nhật ký" type="submit" variant="primary" />
        <button
          className="admin-text-button min-h-10"
          onClick={() => {
            setParams({})
            setValidationError(null)
          }}
          type="button"
        >
          Xóa lọc
        </button>
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
        onRetry={() => setRetry((value) => value + 1)}
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
