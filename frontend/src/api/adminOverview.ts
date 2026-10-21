import { ApiError, apiRequest } from './client'

export interface AdminStatistics {
  accountCount: number
  publishedArticleCount: number
  publishedQuestionCount: number
  visibleAnswerCount: number
  pendingReportCount: number
}

export interface AdminAuditLog {
  id: number
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
    categoryId: number
    categoryName: string
    articleCount: number
    questionCount: number
    topicCount: number
  }[]
  questions: { totalCount: number; unansweredCount: number; unsolvedCount: number; solvedCount: number }
  pendingReports: {
    count: number
    oldest: {
      id: number
      targetType: string
      targetId: number
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
const isAuditLog = (value: unknown): value is AdminAuditLog =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  isRecord(value.administrator) &&
  typeof value.administrator.id === 'string' &&
  typeof value.administrator.displayName === 'string' &&
  typeof value.action === 'string' &&
  typeof value.targetType === 'string' &&
  typeof value.targetId === 'string' &&
  (value.previousValue === null || typeof value.previousValue === 'string') &&
  (value.newValue === null || typeof value.newValue === 'string') &&
  typeof value.reason === 'string' &&
  typeof value.createdAtUtc === 'string'

export const getAdminStatistics = async (signal?: AbortSignal): Promise<AdminStatistics> => {
  const data: unknown = await apiRequest('/api/admin/statistics', { signal })
  if (
    !isRecord(data) ||
    typeof data.accountCount !== 'number' ||
    typeof data.publishedArticleCount !== 'number' ||
    typeof data.publishedQuestionCount !== 'number' ||
    typeof data.visibleAnswerCount !== 'number' ||
    typeof data.pendingReportCount !== 'number'
  ) {
    throw new ApiError(500, 'Dữ liệu thống kê từ API không đúng định dạng.')
  }
  return data as unknown as AdminStatistics
}

export const getAdminAuditLogs = async (
  filters: AuditFilters,
  signal?: AbortSignal,
): Promise<AdminAuditPage> => {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.action) params.set('action', filters.action)
  if (filters.administratorId) params.set('administratorId', filters.administratorId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const data: unknown = await apiRequest(`/api/admin/audit-logs?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAuditLog) ||
    typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' ||
    typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Nhật ký quản trị từ API không đúng định dạng.')
  }
  return data as unknown as AdminAuditPage
}

const hasNumbers = (value: unknown, keys: string[]): value is Record<string, number> =>
  isRecord(value) && keys.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key]))

export const getAdminDashboard = async (
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<AdminDashboard> => {
  const params = new URLSearchParams({ startDate, endDate })
  const data: unknown = await apiRequest(`/api/admin/dashboard?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    typeof data.startDate !== 'string' ||
    typeof data.endDate !== 'string' ||
    typeof data.timeZone !== 'string' ||
    !hasNumbers(data.totals, [
      'accountCount',
      'publishedArticleCount',
      'publishedQuestionCount',
      'visibleAnswerCount',
      'pendingReportCount',
    ]) ||
    !hasNumbers(data.period, ['newMemberCount', 'articleCount', 'questionCount', 'answerCount']) ||
    !Array.isArray(data.activitySeries) ||
    !data.activitySeries.every(
      (item) =>
        isRecord(item) &&
        typeof item.date === 'string' &&
        hasNumbers(item, ['newMemberCount', 'articleCount', 'questionCount', 'answerCount']),
    ) ||
    !Array.isArray(data.categories) ||
    !data.categories.every(
      (item) =>
        isRecord(item) &&
        typeof item.categoryName === 'string' &&
        hasNumbers(item, ['categoryId', 'articleCount', 'questionCount', 'topicCount']),
    ) ||
    !hasNumbers(data.questions, ['totalCount', 'unansweredCount', 'unsolvedCount', 'solvedCount']) ||
    !isRecord(data.pendingReports) ||
    typeof data.pendingReports.count !== 'number' ||
    !Array.isArray(data.pendingReports.oldest) ||
    !data.pendingReports.oldest.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'number' &&
        typeof item.targetType === 'string' &&
        typeof item.targetId === 'number' &&
        typeof item.targetTitle === 'string' &&
        typeof item.reason === 'string' &&
        typeof item.createdAtUtc === 'string' &&
        isRecord(item.reporter) &&
        typeof item.reporter.id === 'string' &&
        typeof item.reporter.displayName === 'string',
    ) ||
    !Array.isArray(data.recentAuditLogs) ||
    !data.recentAuditLogs.every(isAuditLog)
  ) {
    throw new ApiError(500, 'Dữ liệu dashboard từ API không đúng định dạng.')
  }
  return data as unknown as AdminDashboard
}
