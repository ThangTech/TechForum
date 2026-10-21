import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminDashboard, type AdminDashboard } from '../api/adminOverview'
import { ApiError } from '../api/client'
import { appRoutes } from '../appRoutes'
import { DashboardActivityChart } from '../components/admin/DashboardActivityChart'
import { AuditLogList } from '../components/admin/AuditLogList'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
const daysBefore = (date: string, count: number) => {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - count)
  return value.toISOString().slice(0, 10)
}
const readDate = (value: string | null, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) ? value : fallback
const numberFormat = new Intl.NumberFormat('vi-VN')

export const AdminOverviewPage = () => {
  const [params, setParams] = useSearchParams()
  const endDate = readDate(params.get('endDate'), today())
  const startDate = readDate(params.get('startDate'), daysBefore(endDate, 29))
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setDashboard(await getAdminDashboard(startDate, endDate, controller.signal))
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(
          requestError instanceof ApiError ? requestError.message : 'Không thể tải tổng quan quản trị.',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [endDate, startDate, retry])

  const setRange = (days: number) => {
    const end = today()
    setValidationError(null)
    setParams({ startDate: daysBefore(end, days - 1), endDate: end })
  }
  const applyRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const from = String(values.get('startDate'))
    const to = String(values.get('endDate'))
    if (from > to) {
      setValidationError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
      return
    }
    if ((new Date(to).getTime() - new Date(from).getTime()) / 86400000 > 365) {
      setValidationError('Vui lòng chọn tối đa 366 ngày.')
      return
    }
    setValidationError(null)
    setParams({ startDate: from, endDate: to })
  }
  const stats = dashboard
    ? [
        {
          label: 'Tổng thành viên',
          value: dashboard.totals.accountCount,
          period: dashboard.period.newMemberCount,
          suffix: 'thành viên mới',
        },
        {
          label: 'Bài viết công khai',
          value: dashboard.totals.publishedArticleCount,
          period: dashboard.period.articleCount,
          suffix: 'bài viết trong kỳ',
        },
        {
          label: 'Câu hỏi công khai',
          value: dashboard.totals.publishedQuestionCount,
          period: dashboard.period.questionCount,
          suffix: 'câu hỏi trong kỳ',
        },
        {
          label: 'Câu trả lời công khai',
          value: dashboard.totals.visibleAnswerCount,
          period: dashboard.period.answerCount,
          suffix: 'câu trả lời trong kỳ',
        },
        {
          label: 'Báo cáo chờ xử lý',
          value: dashboard.totals.pendingReportCount,
          period: null,
          suffix: 'Cần quản trị viên xem xét',
        },
      ]
    : []

  return (
    <section className="admin-page">
      <div className="admin-dashboard-header">
        <div>
          <p className="eyebrow">TechForum / Điều hành</p>
          <h1 className="font-extrabold">Tổng quan diễn đàn</h1>
          <p className="admin-page-description">Theo dõi đóng góp của cộng đồng và công việc cần xử lý.</p>
        </div>
        <form className="admin-date-toolbar" key={`${startDate}-${endDate}`} onSubmit={applyRange}>
          <div aria-label="Khoảng thời gian nhanh" className="admin-range-buttons">
            <button
              aria-pressed={endDate === today() && startDate === daysBefore(endDate, 6)}
              onClick={() => setRange(7)}
              type="button"
            >
              7 ngày
            </button>
            <button
              aria-pressed={endDate === today() && startDate === daysBefore(endDate, 29)}
              onClick={() => setRange(30)}
              type="button"
            >
              30 ngày
            </button>
          </div>
          <label className="admin-field">
            Từ ngày
            <input defaultValue={startDate} name="startDate" required type="date" />
          </label>
          <label className="admin-field">
            Đến ngày
            <input defaultValue={endDate} name="endDate" required type="date" />
          </label>
          <Button label="Áp dụng" type="submit" variant="secondary" />
        </form>
      </div>
      {validationError && (
        <p className="admin-message admin-message-error" role="alert">
          {validationError}
        </p>
      )}
      <div className="mt-6">
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải dữ liệu tổng quan…"
          onRetry={() => setRetry((value) => value + 1)}
        />
      </div>
      {!isLoading && !error && dashboard && (
        <>
          <section aria-label="Số liệu diễn đàn" className="admin-stats-grid">
            {stats.map((item) => (
              <article className="admin-stat" key={item.label}>
                <p className="admin-stat-label">{item.label}</p>
                <strong className="admin-stat-value">{numberFormat.format(item.value)}</strong>
                <p className="admin-stat-period">
                  {item.period !== null && <strong>+{numberFormat.format(item.period)} </strong>}
                  {item.suffix}
                </p>
              </article>
            ))}
          </section>
          <p className="mt-3 text-[10px] text-slate-500">
            Tổng số tính tại thời điểm hiện tại. Đóng góp trong kỳ tính từ{' '}
            {startDate.split('-').reverse().join('/')} đến {endDate.split('-').reverse().join('/')} (giờ Việt
            Nam), chỉ gồm nội dung còn công khai.
          </p>
          <div className="admin-dashboard-grid">
            <section aria-labelledby="activity-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="activity-title">Hoạt động đóng góp</h2>
                  <p>Bài viết, câu hỏi và câu trả lời theo ngày</p>
                </div>
                <span className="admin-badge admin-badge-blue">Trong kỳ</span>
              </div>
              <DashboardActivityChart items={dashboard.activitySeries} />
            </section>
            <section aria-labelledby="questions-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="questions-title">Tình hình hỏi đáp</h2>
                  <p>{dashboard.questions.totalCount} câu hỏi công khai được đăng trong kỳ</p>
                </div>
                <Link to={appRoutes.adminTopics + '?type=question'}>Quản lý →</Link>
              </div>
              <div className="admin-question-grid">
                {[
                  {
                    label: 'Chưa có câu trả lời',
                    value: dashboard.questions.unansweredCount,
                    color: '#cb8a36',
                  },
                  {
                    label: 'Có trả lời, chưa giải quyết',
                    value: dashboard.questions.unsolvedCount,
                    color: '#4b79bc',
                  },
                  {
                    label: 'Đã có đáp án được chấp nhận',
                    value: dashboard.questions.solvedCount,
                    color: '#4b9271',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="admin-question-row">
                      <span>{item.label}</span>
                      <strong>{numberFormat.format(item.value)}</strong>
                    </div>
                    <div aria-hidden="true" className="admin-progress">
                      <span
                        style={{
                          width: `${dashboard.questions.totalCount ? (item.value / dashboard.questions.totalCount) * 100 : 0}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] leading-5 text-slate-500">
                  Mỗi câu hỏi thuộc đúng một trạng thái. Bản nháp và nội dung bị ẩn/xóa không được tính.
                </p>
              </div>
            </section>
            <section aria-labelledby="reports-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="reports-title">
                    Báo cáo cần xử lý{' '}
                    <span className="admin-badge admin-badge-amber">{dashboard.pendingReports.count}</span>
                  </h2>
                  <p>Ưu tiên báo cáo được gửi sớm nhất</p>
                </div>
                <Link to={appRoutes.adminReports}>Xem tất cả →</Link>
              </div>
              {dashboard.pendingReports.oldest.length === 0 ? (
                <p className="admin-empty !border-0">Không có báo cáo đang chờ xử lý.</p>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <caption className="sr-only">Báo cáo chờ xử lý lâu nhất</caption>
                    <thead>
                      <tr>
                        <th>Nội dung</th>
                        <th>Người báo cáo</th>
                        <th>Đã gửi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.pendingReports.oldest.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <Link className="admin-table-primary" to={appRoutes.adminReports}>
                              {report.targetTitle}
                            </Link>
                            <span className="admin-table-secondary">
                              Báo cáo #{report.id} ·{' '}
                              {report.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'}
                            </span>
                          </td>
                          <td>{report.reporter.displayName}</td>
                          <td className="whitespace-nowrap">
                            {new Date(report.createdAtUtc).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section aria-labelledby="category-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="category-title">Đóng góp theo chuyên mục</h2>
                  <p>Số bài viết và câu hỏi công khai trong kỳ</p>
                </div>
              </div>
              {dashboard.categories.length === 0 ? (
                <p className="admin-empty !border-0">Chưa có đóng góp trong khoảng thời gian này.</p>
              ) : (
                <div className="admin-category-list">
                  {dashboard.categories.map((category) => (
                    <div key={category.categoryId}>
                      <div className="admin-category-head">
                        <span>{category.categoryName}</span>
                        <strong>{numberFormat.format(category.topicCount)}</strong>
                      </div>
                      <div aria-hidden="true" className="admin-progress">
                        <span
                          style={{
                            width: `${(category.topicCount / Math.max(1, ...dashboard.categories.map((item) => item.topicCount))) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {category.articleCount} bài viết · {category.questionCount} câu hỏi
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <section aria-labelledby="audit-title" className="admin-panel mt-5">
            <div className="admin-panel-heading">
              <div>
                <h2 id="audit-title">Hoạt động quản trị gần đây</h2>
                <p>Thao tác và lý do được ghi nhận để đối chiếu</p>
              </div>
              <Link to={appRoutes.adminAudit}>Xem nhật ký →</Link>
            </div>
            {dashboard.recentAuditLogs.length ? (
              <AuditLogList items={dashboard.recentAuditLogs} />
            ) : (
              <p className="admin-empty !border-0">Chưa có thao tác quản trị.</p>
            )}
          </section>
        </>
      )}
    </section>
  )
}
