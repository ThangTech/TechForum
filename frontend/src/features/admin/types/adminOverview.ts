export interface AdminStatistics {
  accountCount: number
  publishedArticleCount: number
  publishedQuestionCount: number
  visibleAnswerCount: number
  pendingReportCount: number
}

export interface AdminAuditLog {
  id: string
  administrator: { id: string; displayName: string }
  action: string
  targetType: string
  targetId: string
  previousValue: string | null
  newValue: string | null
  reason: string
  createdAtUtc: string
}

export interface AdminAuditPage {
  items: AdminAuditLog[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AdminDashboard {
  startDate: string
  endDate: string
  timeZone: string
  totals: AdminStatistics
  period: { newMemberCount: number; articleCount: number; questionCount: number; answerCount: number }
  activitySeries: {
    date: string
    newMemberCount: number
    articleCount: number
    questionCount: number
    answerCount: number
  }[]
  categories: {
    categoryId: string
    categoryName: string
    articleCount: number
    questionCount: number
    topicCount: number
  }[]
  questions: { totalCount: number; unansweredCount: number; unsolvedCount: number; solvedCount: number }
  pendingReports: {
    count: number
    oldest: {
      id: string
      targetType: string
      targetId: string
      targetTitle: string
      reason: string
      reporter: { id: string; displayName: string }
      createdAtUtc: string
    }[]
  }
  recentAuditLogs: AdminAuditLog[]
}

export interface AuditFilters {
  page: number
  pageSize: number
  keyword?: string
  action?: string
  administratorId?: string
  from?: string
  to?: string
}
