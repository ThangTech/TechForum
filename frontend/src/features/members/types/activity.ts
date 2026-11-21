export interface ActivityItem {
  type: 'topic-created' | 'answer-created'
  title: string
  description: string
  link: string
  occurredAtUtc: string
}

export interface ActivityPage {
  items: ActivityItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
