import { ApiError, apiRequest } from '../../../shared/api/client'
import { isRecord } from '../../../shared/api/guards'
import type { Banner } from '../types/banners'

const isBanner = (value: unknown): value is Banner =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.imageUrl === 'string' &&
  (value.linkUrl === null || typeof value.linkUrl === 'string')

// The banners that are shown right now, in display order.
export const getBanners = async (signal?: AbortSignal): Promise<Banner[]> => {
  const data: unknown = await apiRequest('/api/banners', { signal })
  if (!Array.isArray(data) || !data.every(isBanner)) {
    throw new ApiError(500, 'Danh sách banner từ API không đúng định dạng.')
  }
  return data
}
