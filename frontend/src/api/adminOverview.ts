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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isAuditLog = (value: unknown): value is AdminAuditLog =>
  isRecord(value) && typeof value.id === 'number' && isRecord(value.administrator) &&
  typeof value.administrator.id === 'string' && typeof value.administrator.displayName === 'string' &&
  typeof value.action === 'string' && typeof value.targetType === 'string' && typeof value.targetId === 'string' &&
  (value.previousValue === null || typeof value.previousValue === 'string') &&
  (value.newValue === null || typeof value.newValue === 'string') && typeof value.reason === 'string' &&
  typeof value.createdAtUtc === 'string'

export const getAdminStatistics = async (signal?: AbortSignal): Promise<AdminStatistics> => {
  const data: unknown = await apiRequest('/api/admin/statistics', { signal })
  if (!isRecord(data) || typeof data.accountCount !== 'number' || typeof data.publishedArticleCount !== 'number' ||
      typeof data.publishedQuestionCount !== 'number' || typeof data.visibleAnswerCount !== 'number' ||
      typeof data.pendingReportCount !== 'number') {
    throw new ApiError(500, 'Dữ liệu thống kê từ API không đúng định dạng.')
  }
  return data as unknown as AdminStatistics
}

export const getAdminAuditLogs = async (page: number, pageSize: number, signal?: AbortSignal): Promise<AdminAuditPage> => {
  const data: unknown = await apiRequest(`/api/admin/audit-logs?page=${page}&pageSize=${pageSize}`, { signal })
  if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every(isAuditLog) ||
      typeof data.page !== 'number' || typeof data.pageSize !== 'number' ||
      typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number') {
    throw new ApiError(500, 'Nhật ký quản trị từ API không đúng định dạng.')
  }
  return data as unknown as AdminAuditPage
}
