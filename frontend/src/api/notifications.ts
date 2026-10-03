import { apiRequest } from './client'

export interface NotificationItem {
  id: number
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

const isNotification = (value: unknown): value is NotificationItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'number' && typeof item.type === 'string' &&
    typeof item.title === 'string' && typeof item.message === 'string' &&
    typeof item.link === 'string' && typeof item.createdAtUtc === 'string' &&
    (item.readAtUtc === null || typeof item.readAtUtc === 'string')
}

export const getNotifications = async (
  page = 1,
  pageSize = 10,
  signal?: AbortSignal,
): Promise<NotificationPage> => {
  const data = await apiRequest<unknown>(`/api/notifications?page=${page}&pageSize=${pageSize}`, { signal })
  if (typeof data !== 'object' || data === null) throw new Error('API trả về danh sách thông báo không hợp lệ.')
  const value = data as Record<string, unknown>
  if (!Array.isArray(value.items) || !value.items.every(isNotification) ||
      typeof value.page !== 'number' || typeof value.pageSize !== 'number' ||
      typeof value.totalItems !== 'number' || typeof value.totalPages !== 'number' ||
      typeof value.unreadCount !== 'number') {
    throw new Error('API trả về danh sách thông báo không hợp lệ.')
  }
  return value as unknown as NotificationPage
}

export const markNotificationRead = async (id: number): Promise<void> =>
  apiRequest<void>(`/api/notifications/${id}/read`, { method: 'PUT' })
