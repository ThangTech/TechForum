import type { AdminDashboard } from '../types/adminOverview'

// Màu biểu đồ khớp với palette trong DESIGN.md: bài viết xanh dương, câu hỏi hổ phách, trả lời xanh lá.
export const chartColors = {
  article: '#1463d6',
  question: '#b45309',
  answer: '#15803d',
  member: '#7c3aed',
  warning: '#b45309',
}

export interface StatCard {
  label: string
  value: number
  period: number | null
  suffix: string
  color: string
  trend: number[] | null
}

// The five number cards at the top of the dashboard, with the small trend line of the chosen range.
export const getStatCards = (dashboard: AdminDashboard | null): StatCard[] =>
  dashboard
    ? [
        {
          label: 'Tổng thành viên',
          value: dashboard.totals.accountCount,
          period: dashboard.period.newMemberCount,
          suffix: 'thành viên mới',
          color: chartColors.member,
          trend: dashboard.activitySeries.map((item) => item.newMemberCount),
        },
        {
          label: 'Bài viết công khai',
          value: dashboard.totals.publishedArticleCount,
          period: dashboard.period.articleCount,
          suffix: 'bài viết trong kỳ',
          color: chartColors.article,
          trend: dashboard.activitySeries.map((item) => item.articleCount),
        },
        {
          label: 'Câu hỏi công khai',
          value: dashboard.totals.publishedQuestionCount,
          period: dashboard.period.questionCount,
          suffix: 'câu hỏi trong kỳ',
          color: chartColors.question,
          trend: dashboard.activitySeries.map((item) => item.questionCount),
        },
        {
          label: 'Câu trả lời công khai',
          value: dashboard.totals.visibleAnswerCount,
          period: dashboard.period.answerCount,
          suffix: 'câu trả lời trong kỳ',
          color: chartColors.answer,
          trend: dashboard.activitySeries.map((item) => item.answerCount),
        },
        {
          label: 'Báo cáo chờ xử lý',
          value: dashboard.totals.pendingReportCount,
          period: null,
          suffix: 'Cần quản trị viên xem xét',
          color: chartColors.warning,
          trend: null,
        },
      ]
    : []

// The parts of the pie of questions.
export const getQuestionSlices = (dashboard: AdminDashboard | null) =>
  dashboard
    ? [
        { id: 0, label: 'Chưa có câu trả lời', value: dashboard.questions.unansweredCount, color: '#cb8a36' },
        { id: 1, label: 'Có trả lời, chưa giải quyết', value: dashboard.questions.unsolvedCount, color: '#4b79bc' },
        { id: 2, label: 'Đã có đáp án được chấp nhận', value: dashboard.questions.solvedCount, color: '#4b9271' },
      ]
    : []
