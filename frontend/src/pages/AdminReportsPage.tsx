import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AdminReport, ReportStatus } from '../api/reports'
import { ApiError } from '../api/client'
import { ReportResolutionDialog } from '../components/admin/ReportResolutionDialog'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ReportPreviewDialog } from '../components/admin/ReportPreviewDialog'
import { ReportReviewCard } from '../components/admin/ReportReviewCard'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { useAdminReports, useResolveReport } from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

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
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ report: AdminReport; decision: 'accepted' | 'rejected' } | null>(
    null,
  )
  const [preview, setPreview] = useState<AdminReport | null>(null)

  const reportsQuery = useAdminReports(status, page, PAGE_SIZE)
  const resolveMutation = useResolveReport()
  const data = reportsQuery.data ?? null
  const isLoading = isInitialLoading(reportsQuery)
  const error = getErrorMessage(reportsQuery.error, 'Không thể tải danh sách báo cáo.')
  const isResolving = resolveMutation.isPending

  const updateFilters = (nextStatus: ReportStatus, nextPage = 1) => {
    const next = new URLSearchParams()
    if (nextStatus !== 'pending') next.set('status', nextStatus)
    if (nextPage > 1) next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const handleResolution = async (note: string) => {
    if (!selected || isResolving) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      // The list loads again after the decision.
      await resolveMutation.mutateAsync({
        reportId: selected.report.id,
        decision: selected.decision,
        note,
      })
      setSuccessMessage(selected.decision === 'accepted' ? 'Đã chấp nhận báo cáo.' : 'Đã bác bỏ báo cáo.')
      setSelected(null)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể xử lý báo cáo.')
      // 409: another administrator already decided this report, so show the current list.
      if (requestError instanceof ApiError && requestError.status === 409) {
        setSelected(null)
        void reportsQuery.refetch()
      }
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
          <ToggleButtonGroup
            exclusive
            onChange={(_, value: typeof status | null) => value !== null && updateFilters(value)}
            size="small"
            value={status}
          >
            {statuses.map((item) => (
              <ToggleButton key={item.value} value={item.value}>
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
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
            onRetry={() => void reportsQuery.refetch()}
          />
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có báo cáo ở trạng thái này.
            </div>
          )}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <div className="admin-table-scroll">
                <Table className="admin-table" size="small">
                  <caption className="sr-only">Danh sách báo cáo cộng đồng</caption>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nội dung</TableCell>
                      <TableCell>Lý do</TableCell>
                      <TableCell>Người báo cáo</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thời điểm gửi</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
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
                  </TableBody>
                </Table>
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
