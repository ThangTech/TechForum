import { ApiError, apiRequest } from '../../../shared/api/client'
import { isRecord } from '../../../shared/api/guards'
import type { AdminTag, SaveTagInput } from '../types/adminTags'

const isAdminTag = (value: unknown): value is AdminTag =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.slug === 'string' &&
  (value.description === null || typeof value.description === 'string') &&
  typeof value.isActive === 'boolean' &&
  typeof value.topicCount === 'number'

const parseTag = (data: unknown): AdminTag => {
  if (!isAdminTag(data)) throw new ApiError(500, 'Dữ liệu thẻ từ API không đúng định dạng.')
  return data
}

export const getAdminTags = async (signal?: AbortSignal): Promise<AdminTag[]> => {
  const data: unknown = await apiRequest('/api/admin/tags', { signal })
  if (!Array.isArray(data) || !data.every(isAdminTag)) {
    throw new ApiError(500, 'Danh sách thẻ từ API không đúng định dạng.')
  }
  return data
}

export const createAdminTag = async (input: SaveTagInput): Promise<AdminTag> =>
  parseTag(await apiRequest('/api/admin/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  }))

export const updateAdminTag = async (id: string, input: SaveTagInput): Promise<AdminTag> =>
  parseTag(await apiRequest(`/api/admin/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }))

export const setAdminTagActive = async (id: string, isActive: boolean): Promise<AdminTag> =>
  parseTag(await apiRequest(`/api/admin/tags/${id}/active`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }))
