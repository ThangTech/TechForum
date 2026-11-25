export type ReportTargetType = 'topic' | 'answer'

export type ReportReason = 'spam' | 'harassment' | 'misinformation' | 'copyright' | 'other'

export interface CreateReportInput {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details: string | null
}

export interface ReportReceipt {
  id: string
  targetType: ReportTargetType
  targetId: string
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
  id: string
  targetType: ReportTargetType
  targetId: string
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
  topicId: string
  targetAuthor: ReportUser
  isTargetHidden: boolean
  isTargetAutoHidden: boolean
  isTargetDeleted: boolean
  parentAnswerBodyHtml: string | null
  // Số báo cáo đang chờ về cùng nội dung (xử lý một lần cho tất cả) và các lý do của chúng.
  pendingCount: number
  pendingReasons: ReportReason[]
}

export interface AdminReportFilters {
  status: ReportStatus
  targetType: ReportTargetType | ''
  reason: ReportReason | ''
}

export interface MyReport {
  id: string
  targetType: ReportTargetType
  targetId: string
  topicId: string | null
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
