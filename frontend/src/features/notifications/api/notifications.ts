import { apiRequest } from '../../../shared/api/client'
import { hasPaging } from '../../../shared/api/guards'
import type { NotificationItem, NotificationPage } from '../types/notifications'

const isNotification = (value: unknown): value is NotificationItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.type === 'string' &&
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
  if (!Array.isArray(value.items) || !value.items.every(isNotification) || !hasPaging(value) ||
      typeof value.unreadCount !== 'number') {
    throw new Error('API trả về danh sách thông báo không hợp lệ.')
  }
  return value as unknown as NotificationPage
}

export const markNotificationRead = async (id: string): Promise<void> =>
  apiRequest<void>(`/api/notifications/${id}/read`, { method: 'PUT' })
