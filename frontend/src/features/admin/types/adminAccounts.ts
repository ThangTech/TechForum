export interface AdminAccount {
  id: string
  displayName: string
  email: string
  createdAtUtc: string
  isLocked: boolean
  isAdministrator: boolean
  lockReason: string | null
  lockoutEndUtc: string | null
  emailConfirmed: boolean
  topicCount: number
  answerCount: number
  // Số nội dung của người này bị báo cáo và đã được chấp nhận là vi phạm.
  violationCount: number
}

export interface AdminAccountPage {
  items: AdminAccount[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
