import { ApiError, apiRequest } from './client'

// A picture of the slider on the home page.
export interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

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
