import { ApiError, apiRequest } from '../../../shared/api/client'
import { hasPaging } from '../../../shared/api/guards'
import type { ActivityItem, ActivityPage } from '../types/activity'

const isActivity = (value: unknown): value is ActivityItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (item.type === 'topic-created' || item.type === 'answer-created') &&
    typeof item.title === 'string' && typeof item.description === 'string' &&
    typeof item.link === 'string' && typeof item.occurredAtUtc === 'string'
}

export const getMyActivity = async (page: number, pageSize: number, signal?: AbortSignal): Promise<ActivityPage> => {
  const data = await apiRequest<unknown>(`/api/activity/mine?page=${page}&pageSize=${pageSize}`, { signal })
  if (typeof data !== 'object' || data === null) throw new ApiError(500, 'Dữ liệu lịch sử không đúng định dạng.')
  const result = data as Record<string, unknown>
  if (!Array.isArray(result.items) || !result.items.every(isActivity) || !hasPaging(result)) {
    throw new ApiError(500, 'Dữ liệu lịch sử không đúng định dạng.')
  }
  return result as unknown as ActivityPage
}
