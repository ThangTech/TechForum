import type { AdminReport } from '../../api/reports'
import { reportReasonLabels, reportStatusLabels } from './reportLabels'
import { StatusBadge, type BadgeTone } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

const getReportTone = (status: AdminReport['status']): BadgeTone => {
  if (status === 'pending') return 'amber'
  if (status === 'accepted') return 'green'
  return 'neutral'
}

export const ReportReviewCard = ({
  report,
  onResolve,
  onPreview,
}: {
  report: AdminReport
  onResolve: (report: AdminReport, decision: 'accepted' | 'rejected') => void
  onPreview: (report: AdminReport) => void
}) => (
  <TableRow>
    <TableCell>
      <button
        className="admin-table-primary text-left hover:text-blue-700"
        onClick={() => onPreview(report)}
        type="button"
      >
        {report.targetTitle}
      </button>
      <span className="admin-table-secondary">
        Báo cáo #{report.id} · {report.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'}
      </span>
    </TableCell>
    <TableCell>
      {reportReasonLabels[report.reason]}
      {report.details && <p className="admin-table-secondary max-w-60 line-clamp-2">{report.details}</p>}
    </TableCell>
    <TableCell className="whitespace-nowrap">{report.reporter.displayName}</TableCell>
    <TableCell>
      <StatusBadge tone={getReportTone(report.status)}>
        {reportStatusLabels[report.status]}
      </StatusBadge>
      {report.resolvedBy && <span className="admin-table-secondary">{report.resolvedBy.displayName}</span>}
    </TableCell>
    <TableCell className="whitespace-nowrap">
      {new Date(report.createdAtUtc).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
    </TableCell>
    <TableCell>
      <div className="admin-table-actions">
        <button onClick={() => onPreview(report)} type="button">
          Xem chi tiết
        </button>
        {report.status === 'pending' && (
          <>
            <button onClick={() => onResolve(report, 'accepted')} type="button">
              Chấp nhận
            </button>
            <button onClick={() => onResolve(report, 'rejected')} type="button">
              Bác bỏ
            </button>
          </>
        )}
      </div>
    </TableCell>
  </TableRow>
)
