import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { AuditLogList } from '../components/AuditLogList'
import { StatusBadge } from '../components/StatusBadge'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { useAdminOverviewPage } from '../hooks/useAdminOverviewPage'
import { chartColors } from '../utils/dashboardCards'

const numberFormat = new Intl.NumberFormat('vi-VN')
const shortDate = (date: string) => date.slice(5).split('-').reverse().join('/')

export const AdminOverviewPage = () => {
  const view = useAdminOverviewPage()
  const { dashboard, endDate, questionSlices, startDate, stats } = view

  return (
    <section className="admin-page">
      <div className="admin-dashboard-header">
        <div>
          <p className="eyebrow">TechForum / Điều hành</p>
          <Typography component="h1" sx={{ fontWeight: 800 }}>Tổng quan diễn đàn</Typography>
          <p className="admin-page-description">Theo dõi đóng góp của cộng đồng và công việc cần xử lý.</p>
        </div>
        <form className="admin-date-toolbar" key={`${startDate}-${endDate}`} onSubmit={view.applyRange}>
          <ToggleButtonGroup
            aria-label="Khoảng thời gian nhanh"
            exclusive
            onChange={(_, days: number | null) => days && view.setRange(days)}
            size="small"
            value={view.activeRange}
          >
            <ToggleButton value={7}>7 ngày</ToggleButton>
            <ToggleButton value={30}>30 ngày</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            defaultValue={startDate}
            label="Từ ngày"
            name="startDate"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
            type="date"
          />
          <TextField
            defaultValue={endDate}
            label="Đến ngày"
            name="endDate"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
            type="date"
          />
          <Button type="submit" variant="outlined">Áp dụng</Button>
        </form>
      </div>
      <AdminFeedback error={view.validationError} />
      <Box sx={{ mt: 3 }}>
        <AsyncStatePanel
          error={view.error}
          isLoading={view.isLoading}
          loadingText="Đang tải dữ liệu tổng quan…"
          onRetry={view.retry}
        />
      </Box>
      {!view.isLoading && !view.error && dashboard && (
        <>
          <section aria-label="Số liệu diễn đàn" className="admin-stats-grid">
            {stats.map((item) => (
              <article className="admin-stat" key={item.label} style={item.link ? { position: 'relative' } : undefined}>
                <p className="admin-stat-label">
                  {item.link
                    ? <Link className="admin-stat-link" to={item.link}>{item.label}</Link>
                    : item.label}
                </p>
                <strong className="admin-stat-value">{numberFormat.format(item.value)}</strong>
                <p className="admin-stat-period">
                  {item.period !== null && <strong>+{numberFormat.format(item.period)} </strong>}
                  {item.suffix}
                </p>
                {item.trend && (
                  <div aria-hidden="true" className="admin-stat-trend">
                    <SparkLineChart
                      area
                      color={item.color}
                      curve="natural"
                      data={item.trend}
                      height={44}
                    />
                  </div>
                )}
              </article>
            ))}
          </section>
          <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '10px' }}>
            Tổng số tính tại thời điểm hiện tại. Đóng góp trong kỳ tính từ{' '}
            {startDate.split('-').reverse().join('/')} đến {endDate.split('-').reverse().join('/')} (giờ Việt
            Nam), chỉ gồm nội dung còn công khai.
          </Typography>
          <div className="admin-dashboard-grid">
            <section aria-labelledby="activity-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="activity-title">Hoạt động đóng góp</h2>
                  <p>Bài viết, câu hỏi và câu trả lời theo ngày</p>
                </div>
                <StatusBadge tone="blue">Trong kỳ</StatusBadge>
              </div>
              <div className="admin-chart-body">
                <LineChart
                  height={290}
                  margin={{ left: 8, right: 16, top: 16, bottom: 8 }}
                  series={[
                    { data: dashboard.activitySeries.map((item) => item.articleCount), label: 'Bài viết', color: chartColors.article, showMark: false, curve: 'monotoneX' },
                    { data: dashboard.activitySeries.map((item) => item.questionCount), label: 'Câu hỏi', color: chartColors.question, showMark: false, curve: 'monotoneX' },
                    { data: dashboard.activitySeries.map((item) => item.answerCount), label: 'Câu trả lời', color: chartColors.answer, showMark: false, curve: 'monotoneX' },
                  ]}
                  xAxis={[{
                    scaleType: 'point',
                    data: dashboard.activitySeries.map((item) => item.date),
                    valueFormatter: (value: string) => shortDate(value),
                    tickLabelInterval: (_value: string, index: number) =>
                      index % Math.max(1, Math.ceil(dashboard.activitySeries.length / 8)) === 0,
                  }]}
                  yAxis={[{ min: 0 }]}
                />
              </div>
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
                {dashboard.questions.totalCount > 0 && (
                  <PieChart
                    height={190}
                    hideLegend
                    series={[{
                      data: questionSlices,
                      innerRadius: 52,
                      outerRadius: 86,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    }]}
                  />
                )}
                {questionSlices.map((item) => (
                  <div className="admin-question-row" key={item.id}>
                    <Stack component="span" direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <Box aria-hidden="true" component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '2px', bgcolor: item.color }} />
                      {item.label}
                    </Stack>
                    <strong>{numberFormat.format(item.value)}</strong>
                  </div>
                ))}
                <Typography color="text.secondary" sx={{ fontSize: '10px', lineHeight: '1.25rem' }}>
                  Mỗi câu hỏi thuộc đúng một trạng thái. Bản nháp và nội dung bị ẩn/xóa không được tính.
                </Typography>
              </div>
            </section>
            <section aria-labelledby="reports-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="reports-title">
                    Báo cáo cần xử lý <StatusBadge tone="amber">{dashboard.pendingReports.count}</StatusBadge>
                  </h2>
                  <p>Ưu tiên báo cáo được gửi sớm nhất</p>
                </div>
                <Link to={appRoutes.adminReports}>Xem tất cả →</Link>
              </div>
              {dashboard.pendingReports.oldest.length === 0 ? (
                <AdminEmptyState flat>Không có báo cáo đang chờ xử lý.</AdminEmptyState>
              ) : (
                <div className="admin-table-scroll">
                  <Table className="admin-table" size="small">
                    <caption className="sr-only">Báo cáo chờ xử lý lâu nhất</caption>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nội dung</TableCell>
                        <TableCell>Người báo cáo</TableCell>
                        <TableCell>Đã gửi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.pendingReports.oldest.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Link className="admin-table-primary" to={appRoutes.adminReports}>
                              {report.targetTitle}
                            </Link>
                            <span className="admin-table-secondary">
                              {report.targetType === 'topic' ? 'Bài viết / câu hỏi' : 'Câu trả lời'}
                            </span>
                          </TableCell>
                          <TableCell>{report.reporter.displayName}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {new Date(report.createdAtUtc).toLocaleDateString('vi-VN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <AdminEmptyState flat>Chưa có đóng góp trong khoảng thời gian này.</AdminEmptyState>
              ) : (
                <div className="admin-chart-body">
                  <BarChart
                    dataset={dashboard.categories}
                    height={Math.max(180, 56 + dashboard.categories.length * 44)}
                    layout="horizontal"
                    margin={{ left: 8, right: 16, top: 16, bottom: 8 }}
                    series={[
                      { dataKey: 'articleCount', label: 'Bài viết', color: chartColors.article, stack: 'topics' },
                      { dataKey: 'questionCount', label: 'Câu hỏi', color: chartColors.question, stack: 'topics' },
                    ]}
                    yAxis={[{ scaleType: 'band', dataKey: 'categoryName', width: 120 }]}
                  />
                </div>
              )}
            </section>
          </div>
          <Box aria-labelledby="audit-title" className="admin-panel" component="section" sx={{ mt: 2.5 }}>
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
              <AdminEmptyState flat>Chưa có thao tác quản trị.</AdminEmptyState>
            )}
          </Box>
        </>
      )}
    </section>
  )
}
