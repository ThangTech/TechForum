import type { AdminReport } from '../../api/reports'
import { reportReasonLabels, reportStatusLabels } from './reportLabels'

export const ReportReviewCard = ({
  report,
  onResolve,
  onPreview,
}: {
  report: AdminReport
  onResolve: (report: AdminReport, decision: 'accepted' | 'rejected') => void
  onPreview: (report: AdminReport) => void
}) => (
  <tr>
    <td>
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
    </td>
    <td>
      {reportReasonLabels[report.reason]}
      {report.details && <p className="admin-table-secondary max-w-60 line-clamp-2">{report.details}</p>}
    </td>
    <td className="whitespace-nowrap">{report.reporter.displayName}</td>
    <td>
      <span
        className={`admin-badge ${report.status === 'pending' ? 'admin-badge-amber' : report.status === 'accepted' ? 'admin-badge-green' : ''}`}
      >
        {reportStatusLabels[report.status]}
      </span>
      {report.resolvedBy && <span className="admin-table-secondary">{report.resolvedBy.displayName}</span>}
    </td>
    <td className="whitespace-nowrap">
      {new Date(report.createdAtUtc).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
    </td>
    <td>
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
    </td>
  </tr>
)
