import type { AdminStatistics } from '../../api/adminOverview'

export const AdminStatisticsGrid = ({ statistics }: { statistics: AdminStatistics }) => {
  const items = [
    ['Tài khoản', statistics.accountCount],
    ['Bài viết đã xuất bản', statistics.publishedArticleCount],
    ['Câu hỏi đã xuất bản', statistics.publishedQuestionCount],
    ['Câu trả lời công khai', statistics.visibleAnswerCount],
    ['Báo cáo chờ xử lý', statistics.pendingReportCount],
  ] as const

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Thống kê TechForum">
      {items.map(([label, value]) => (
        <article className="rounded-xl border border-slate-200 bg-white p-5" key={label}>
          <p className="text-3xl font-extrabold text-blue-700">{value}</p>
          <p className="mt-2 text-sm leading-5 text-slate-600">{label}</p>
        </article>
      ))}
    </section>
  )
}
