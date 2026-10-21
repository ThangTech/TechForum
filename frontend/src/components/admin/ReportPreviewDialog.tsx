import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { Link } from 'react-router-dom'
import type { AdminReport } from '../../api/reports'
import { appRoutes } from '../../appRoutes'
import { reportReasonLabels, reportStatusLabels } from './reportLabels'

export const ReportPreviewDialog = ({
  report,
  onClose,
  onResolve,
}: {
  report: AdminReport
  onClose: () => void
  onResolve: (report: AdminReport, decision: 'accepted' | 'rejected') => void
}) => (
  <Dialog
    aria-label={`Chi tiết báo cáo #${report.id}`}
    isOpen
    onOpenChange={(open) => !open && onClose()}
    padding={0}
    width={850}
  >
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Chi tiết báo cáo #{report.id}</h2>
        <span className="admin-badge admin-badge-blue">{reportStatusLabels[report.status]}</span>
      </div>
      <h3 className="mt-5 text-lg font-bold">{report.targetTitle}</h3>
      <p className="mt-2 text-xs text-slate-500">
        {report.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'} của {report.targetAuthor.displayName} ·{' '}
        {report.isTargetDeleted ? 'Tác giả đã xóa' : report.isTargetHidden ? 'Đang bị ẩn' : 'Đang hiển thị'}
      </p>
      <div className="mt-5 border border-slate-200 bg-slate-50 p-4 text-sm">
        <strong>{reportReasonLabels[report.reason]}</strong>
        <p className="mt-2 leading-6">{report.details || 'Người báo cáo không cung cấp mô tả thêm.'}</p>
        <p className="mt-3 text-xs text-slate-500">
          {report.reporter.displayName} · {new Date(report.createdAtUtc).toLocaleString('vi-VN')}
        </p>
      </div>
      {report.parentAnswerBodyHtml && (
        <details className="mt-4 border border-slate-200 p-4">
          <summary className="cursor-pointer text-xs font-bold text-slate-600">
            Ngữ cảnh: câu trả lời gốc
          </summary>
          <div
            className="fr-view reading-content admin-preview mt-3"
            dangerouslySetInnerHTML={{ __html: report.parentAnswerBodyHtml }}
          />
        </details>
      )}
      <h4 className="mt-5 text-sm font-bold">Nội dung bị báo cáo</h4>
      <div
        className="admin-preview fr-view reading-content mt-3"
        dangerouslySetInnerHTML={{ __html: report.targetBodyHtml }}
      />
      {report.status !== 'pending' && (
        <div className="mt-5 border border-slate-200 p-4 text-sm">
          <strong>Kết quả xử lý</strong>
          <p className="mt-2 leading-6">{report.resolutionNote}</p>
          <p className="mt-2 text-xs text-slate-500">
            {report.resolvedBy?.displayName ?? 'Không xác định'}
            {report.resolvedAtUtc && ` · ${new Date(report.resolvedAtUtc).toLocaleString('vi-VN')}`}
          </p>
        </div>
      )}
      <p className="mt-4 text-xs leading-6 text-slate-500">
        Kết quả báo cáo được lưu riêng. Nếu cần ẩn hoặc khóa chủ đề, hãy mở quản lý nội dung và thực hiện kiểm
        duyệt kèm lý do.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-blue-700">
        <Link to={appRoutes.adminTopics + `?keyword=${encodeURIComponent(report.targetTitle)}`}>
          Quản lý chủ đề →
        </Link>
        {!report.isTargetHidden && !report.isTargetDeleted && (
          <Link
            to={
              appRoutes.topic(report.topicId) +
              (report.targetType === 'answer' ? `#answer-${report.targetId}` : '')
            }
          >
            Mở trên diễn đàn ↗
          </Link>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button label="Đóng" onClick={onClose} variant="secondary" />
        {report.status === 'pending' && (
          <>
            <Button
              label="Bác bỏ báo cáo"
              onClick={() => onResolve(report, 'rejected')}
              variant="secondary"
            />
            <Button
              label="Chấp nhận báo cáo"
              onClick={() => onResolve(report, 'accepted')}
              variant="primary"
            />
          </>
        )}
      </div>
    </div>
  </Dialog>
)
