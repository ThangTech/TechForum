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
