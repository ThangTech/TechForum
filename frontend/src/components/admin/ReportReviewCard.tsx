import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { AdminReport } from '../../api/reports'
import { appRoutes } from '../../appRoutes'

interface ReportReviewCardProps {
  onResolve: (report: AdminReport, decision: 'accepted' | 'rejected') => void
  report: AdminReport
}

const reasonLabels: Record<AdminReport['reason'], string> = {
  spam: 'Spam hoặc quảng cáo',
  harassment: 'Quấy rối hoặc công kích',
  misinformation: 'Thông tin sai lệch',
  copyright: 'Vi phạm bản quyền',
  other: 'Lý do khác',
}

const statusLabels: Record<AdminReport['status'], string> = {
  pending: 'Chờ xử lý',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã bác bỏ',
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const ReportReviewCard = ({ onResolve, report }: ReportReviewCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          {statusLabels[report.status]}
        </span>
        <h2 className="mt-3 text-xl font-extrabold text-slate-950">{report.targetTitle}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Báo cáo bởi {report.reporter.displayName} · {formatDateTime(report.createdAtUtc)}
        </p>
      </div>
      {report.targetType === 'topic' && (
        <Link className="text-sm font-bold text-blue-700 hover:underline" to={appRoutes.topic(report.targetId)}>
          Mở nội dung
        </Link>
      )}
    </header>

    <div className="mt-5 rounded-lg bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-800">{reasonLabels[report.reason]}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{report.details || 'Người báo cáo không cung cấp mô tả thêm.'}</p>
    </div>

    <details className="mt-4 rounded-lg border border-slate-200 p-4">
      <summary className="cursor-pointer text-sm font-bold text-slate-800">Xem nội dung bị báo cáo</summary>
      <div
        className="mt-4 max-h-80 overflow-auto text-sm leading-7 text-slate-700 [&_a]:text-blue-700 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_img]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100"
        dangerouslySetInnerHTML={{ __html: report.targetBodyHtml }}
      />
    </details>

    {report.status === 'pending' ? (
      <footer className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <Button label="Chấp nhận báo cáo" onClick={() => onResolve(report, 'accepted')} variant="primary" />
        <Button label="Bác bỏ báo cáo" onClick={() => onResolve(report, 'rejected')} variant="secondary" />
      </footer>
    ) : (
      <footer className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <p><strong>Người xử lý:</strong> {report.resolvedBy?.displayName ?? 'Không xác định'}</p>
        <p className="mt-1"><strong>Lý do:</strong> {report.resolutionNote}</p>
        {report.resolvedAtUtc && <p className="mt-1"><strong>Thời điểm:</strong> {formatDateTime(report.resolvedAtUtc)}</p>}
      </footer>
    )}
  </article>
)
