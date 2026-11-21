export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  link: string
  createdAtUtc: string
  readAtUtc: string | null
}

export interface NotificationPage {
  items: NotificationItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  unreadCount: number
}
