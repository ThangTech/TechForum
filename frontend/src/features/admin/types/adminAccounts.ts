export interface AdminAccount {
  id: string
  displayName: string
  email: string
  createdAtUtc: string
  isLocked: boolean
  isAdministrator: boolean
  lockReason: string | null
  lockoutEndUtc: string | null
}

export interface AdminAccountPage {
  items: AdminAccount[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
