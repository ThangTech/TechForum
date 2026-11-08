import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AdminReport, ReportStatus } from '../api/reports'
import { ApiError } from '../api/client'
import { ReportResolutionDialog } from '../components/admin/ReportResolutionDialog'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ReportPreviewDialog } from '../components/admin/ReportPreviewDialog'
import { ReportReviewCard } from '../components/admin/ReportReviewCard'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/admin/AdminEmptyState'
import { AdminFeedback } from '../components/admin/AdminFeedback'
import { AdminPageHeading } from '../components/admin/AdminPageHeading'
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
import Typography from '@mui/material/Typography'

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
        <AdminPageHeading
          description="Xem nội dung bị báo cáo và lưu quyết định xử lý có lý do rõ ràng."
          eyebrow="Quản trị nội dung"
          title="Báo cáo cộng đồng"
        />

        <div className="admin-toolbar" role="group" aria-label="Lọc trạng thái báo cáo">
          <Typography color="text.secondary" component="span" sx={{ mr: 1, fontSize: '0.75rem', fontWeight: 600 }}>Trạng thái:</Typography>
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

        <AdminFeedback error={actionError} success={successMessage} />

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải báo cáo…"
            onRetry={() => void reportsQuery.refetch()}
          />
          {!isLoading && !error && data?.items.length === 0 && (
            <AdminEmptyState>Không có báo cáo ở trạng thái này.</AdminEmptyState>
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
