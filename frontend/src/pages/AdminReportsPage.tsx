import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminReports,
  resolveReport,
  type AdminReport,
  type AdminReportPage,
  type ReportStatus,
} from '../api/reports'
import { ApiError } from '../api/client'
import { ReportResolutionDialog } from '../components/admin/ReportResolutionDialog'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ReportPreviewDialog } from '../components/admin/ReportPreviewDialog'
import { ReportReviewCard } from '../components/admin/ReportReviewCard'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

const PAGE_SIZE = 10
const statuses: { label: string; value: ReportStatus }[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'accepted', label: 'Đã chấp nhận' },
  { value: 'rejected', label: 'Đã bác bỏ' },
]

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const readStatus = (value: string | null): ReportStatus =>
  value === 'accepted' || value === 'rejected' ? value : 'pending'

export const AdminReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const status = readStatus(searchParams.get('status'))
  const [data, setData] = useState<AdminReportPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ report: AdminReport; decision: 'accepted' | 'rejected' } | null>(
    null,
  )
  const [isResolving, setIsResolving] = useState(false)
  const [retry, setRetry] = useState(0)
  const [preview, setPreview] = useState<AdminReport | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(await getAdminReports(status, page, PAGE_SIZE, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách báo cáo.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [page, retry, status])

  const updateFilters = (nextStatus: ReportStatus, nextPage = 1) => {
    const next = new URLSearchParams()
    if (nextStatus !== 'pending') next.set('status', nextStatus)
    if (nextPage > 1) next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const handleResolution = async (note: string) => {
    if (!selected || isResolving) return
    setIsResolving(true)
    setActionError(null)
    setSuccessMessage(null)
    try {
      await resolveReport(selected.report.id, selected.decision, note)
      setSuccessMessage(selected.decision === 'accepted' ? 'Đã chấp nhận báo cáo.' : 'Đã bác bỏ báo cáo.')
      setSelected(null)
      setRetry((value) => value + 1)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể xử lý báo cáo.')
      if (requestError instanceof ApiError && requestError.status === 409) {
        setSelected(null)
        setRetry((value) => value + 1)
      }
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <section className="admin-page">
      <div>
        <p className="eyebrow">Quản trị nội dung</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Báo cáo cộng đồng</h1>
        <p className="mt-2 text-slate-600">
          Xem nội dung bị báo cáo và lưu quyết định xử lý có lý do rõ ràng.
        </p>

        <div className="admin-toolbar" role="group" aria-label="Lọc trạng thái báo cáo">
          <span className="text-xs font-semibold text-slate-500 mr-2">Trạng thái:</span>
          {statuses.map((item) => (
            <button
              aria-pressed={status === item.value}
              className={`admin-text-button ${status === item.value ? '!bg-blue-50 !border-blue-300 !text-blue-800' : ''}`}
              key={item.value}
              onClick={() => updateFilters(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {actionError && (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </p>
        )}
        {successMessage && (
          <p
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải báo cáo…"
            onRetry={() => setRetry((value) => value + 1)}
          />
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có báo cáo ở trạng thái này.
            </div>
          )}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <caption className="sr-only">Danh sách báo cáo cộng đồng</caption>
                  <thead>
                    <tr>
                      <th>Nội dung</th>
                      <th>Lý do</th>
                      <th>Người báo cáo</th>
                      <th>Trạng thái</th>
                      <th>Thời điểm gửi</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((report) => (
                      <ReportReviewCard
                        key={report.id}
                        onPreview={setPreview}
                        onResolve={(item, decision) => {
                          setActionError(null)
                          setSuccessMessage(null)
                          setSelected({ report: item, decision })
                        }}
                        report={report}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!isLoading && !error && data && (
            <AdminPagination {...data} onChange={(nextPage) => updateFilters(status, nextPage)} />
          )}
        </div>
      </div>

      {preview && (
        <ReportPreviewDialog
          onClose={() => setPreview(null)}
          onResolve={(report, decision) => {
            setPreview(null)
            setActionError(null)
            setSelected({ report, decision })
          }}
          report={preview}
        />
      )}
      <ReportResolutionDialog
        key={`${selected?.report.id ?? 'none'}-${selected?.decision ?? 'none'}`}
        decision={selected?.decision ?? null}
        isBusy={isResolving}
        onClose={() => {
          setActionError(null)
          setSelected(null)
        }}
        onConfirm={(note) => void handleResolution(note)}
        requestError={actionError}
      />
    </section>
  )
}
