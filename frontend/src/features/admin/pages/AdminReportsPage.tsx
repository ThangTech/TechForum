import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import type { ReportStatus } from '../../reports/types/reports'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { AdminPagination } from '../components/AdminPagination'
import { ReportPreviewDialog } from '../components/ReportPreviewDialog'
import { ReportResolutionDialog } from '../components/ReportResolutionDialog'
import { ReportReviewCard } from '../components/ReportReviewCard'
import { useAdminReportsPage } from '../hooks/useAdminReportsPage'

const statuses: { label: string; value: ReportStatus }[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'accepted', label: 'Đã chấp nhận' },
  { value: 'rejected', label: 'Đã bác bỏ' },
]

export const AdminReportsPage = () => {
  const view = useAdminReportsPage()
  const { data, decision, preview, status } = view
  const isReady = !view.isLoading && !view.error

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
            onChange={(_, value: typeof status | null) => value !== null && view.showStatus(value)}
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

        <AdminFeedback error={view.feedback.error} success={view.feedback.success} />

        <div>
          <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải báo cáo…" onRetry={view.retry} />
          {isReady && data?.items.length === 0 && (
            <AdminEmptyState>Không có báo cáo ở trạng thái này.</AdminEmptyState>
          )}
          {isReady && data && data.items.length > 0 && (
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
                        onPreview={preview.open}
                        onResolve={decision.choose}
                        report={report}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {isReady && data && (
            <AdminPagination {...data} onChange={(nextPage) => view.showStatus(status, nextPage)} />
          )}
        </div>
      </div>

      {preview.report && (
        <ReportPreviewDialog onClose={preview.close} onResolve={preview.choose} report={preview.report} />
      )}
      <ReportResolutionDialog
        key={`${decision.selected?.report.id ?? 'none'}-${decision.selected?.decision ?? 'none'}`}
        decision={decision.selected?.decision ?? null}
        isBusy={decision.isBusy}
        onClose={decision.close}
        onConfirm={(note) => void decision.confirm(note)}
        requestError={decision.error}
      />
    </section>
  )
}
