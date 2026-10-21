import { ApiError, apiRequest } from './client'

export type ReportTargetType = 'topic' | 'answer'
export type ReportReason = 'spam' | 'harassment' | 'misinformation' | 'copyright' | 'other'

export interface CreateReportInput {
  targetType: ReportTargetType
  targetId: number
  reason: ReportReason
  details: string | null
}

export interface ReportReceipt {
  id: number
  targetType: ReportTargetType
  targetId: number
  reason: ReportReason
  details: string | null
  status: 'pending'
  createdAtUtc: string
}

export type ReportStatus = 'pending' | 'accepted' | 'rejected'

export interface ReportUser {
  id: string
  displayName: string
}

export interface AdminReport {
  id: number
  targetType: ReportTargetType
  targetId: number
  targetTitle: string
  targetBodyHtml: string
  reporter: ReportUser
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAtUtc: string
  resolvedBy: ReportUser | null
  resolvedAtUtc: string | null
  resolutionNote: string | null
  topicId: number
  targetAuthor: ReportUser
  isTargetHidden: boolean
  isTargetDeleted: boolean
  parentAnswerBodyHtml: string | null
}

export interface MyReport {
  id: number
  targetType: ReportTargetType
  targetId: number
  topicId: number | null
  targetTitle: string | null
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAtUtc: string
  resolvedAtUtc: string | null
  resolutionNote: string | null
}

export interface MyReportPage {
  items: MyReport[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AdminReportPage {
  items: AdminReport[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const reportReasons: ReportReason[] = [
  'spam',
  'harassment',
  'misinformation',
  'copyright',
  'other',
]

const isReportReason = (value: unknown): value is ReportReason =>
  typeof value === 'string' && reportReasons.includes(value as ReportReason)

const isReportUser = (value: unknown): value is ReportUser =>
  isRecord(value) && typeof value.id === 'string' && typeof value.displayName === 'string'

const isAdminReport = (value: unknown): value is AdminReport =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  (value.targetType === 'topic' || value.targetType === 'answer') &&
  typeof value.targetId === 'number' &&
  typeof value.targetTitle === 'string' &&
  typeof value.targetBodyHtml === 'string' &&
  isReportUser(value.reporter) &&
  isReportReason(value.reason) &&
  (value.details === null || typeof value.details === 'string') &&
  (value.status === 'pending' || value.status === 'accepted' || value.status === 'rejected') &&
  typeof value.createdAtUtc === 'string' &&
  (value.resolvedBy === null || isReportUser(value.resolvedBy)) &&
  (value.resolvedAtUtc === null || typeof value.resolvedAtUtc === 'string') &&
  (value.resolutionNote === null || typeof value.resolutionNote === 'string') &&
  typeof value.topicId === 'number' && isReportUser(value.targetAuthor) &&
  typeof value.isTargetHidden === 'boolean' && typeof value.isTargetDeleted === 'boolean' &&
  (value.parentAnswerBodyHtml === null || typeof value.parentAnswerBodyHtml === 'string')

const isMyReport = (value: unknown): value is MyReport =>
  isRecord(value) && typeof value.id === 'number' &&
  (value.targetType === 'topic' || value.targetType === 'answer') &&
  typeof value.targetId === 'number' &&
  (value.topicId === null || typeof value.topicId === 'number') &&
  (value.targetTitle === null || typeof value.targetTitle === 'string') &&
  isReportReason(value.reason) &&
  (value.details === null || typeof value.details === 'string') &&
  (value.status === 'pending' || value.status === 'accepted' || value.status === 'rejected') &&
  typeof value.createdAtUtc === 'string' &&
  (value.resolvedAtUtc === null || typeof value.resolvedAtUtc === 'string') &&
  (value.resolutionNote === null || typeof value.resolutionNote === 'string')

const parseReportReceipt = (data: unknown): ReportReceipt => {
  if (
    !isRecord(data) ||
    typeof data.id !== 'number' ||
    (data.targetType !== 'topic' && data.targetType !== 'answer') ||
    typeof data.targetId !== 'number' ||
    !isReportReason(data.reason) ||
    (data.details !== null && typeof data.details !== 'string') ||
    data.status !== 'pending' ||
    typeof data.createdAtUtc !== 'string'
  ) {
    throw new ApiError(500, 'Dữ liệu xác nhận báo cáo từ API không đúng định dạng.')
  }

  return data as unknown as ReportReceipt
}

export const createReport = async (input: CreateReportInput): Promise<ReportReceipt> =>
  parseReportReceipt(await apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  }))

export const getAdminReports = async (
  status: ReportStatus,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<AdminReportPage> => {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) })
  const data: unknown = await apiRequest(`/api/reports/admin?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAdminReport) ||
    typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' ||
    typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Danh sách báo cáo từ API không đúng định dạng.')
  }

  return data as unknown as AdminReportPage
}

export const resolveReport = async (
  reportId: number,
  decision: 'accepted' | 'rejected',
  resolutionNote: string,
): Promise<AdminReport> => {
  const data: unknown = await apiRequest(`/api/reports/admin/${reportId}/resolution`, {
    method: 'PUT',
    body: JSON.stringify({ decision, resolutionNote }),
  })
  if (!isAdminReport(data)) {
    throw new ApiError(500, 'Dữ liệu báo cáo đã xử lý từ API không đúng định dạng.')
  }

  return data
}

export const getMyReports = async (
  status: ReportStatus | '', page: number, pageSize: number, signal?: AbortSignal,
): Promise<MyReportPage> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status) params.set('status', status)
  const data: unknown = await apiRequest(`/api/reports/mine?${params.toString()}`, { signal })
  if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every(isMyReport) ||
    typeof data.page !== 'number' || typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number') {
    throw new ApiError(500, 'Danh sách báo cáo của bạn từ API không đúng định dạng.')
  }
  return data as unknown as MyReportPage
}
