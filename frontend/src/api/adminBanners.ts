import { ApiError, apiRequest } from './client'

export interface AdminBanner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  isActive: boolean
  startsAtUtc: string | null
  endsAtUtc: string | null
  createdAtUtc: string
}

export interface SaveBannerInput {
  title: string
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  startsAtUtc: string | null
  endsAtUtc: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNullableString = (value: unknown) => value === null || typeof value === 'string'

const isAdminBanner = (value: unknown): value is AdminBanner =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.imageUrl === 'string' &&
  isNullableString(value.linkUrl) &&
  typeof value.displayOrder === 'number' &&
  typeof value.isActive === 'boolean' &&
  isNullableString(value.startsAtUtc) &&
  isNullableString(value.endsAtUtc) &&
  typeof value.createdAtUtc === 'string'

const parseBanner = (data: unknown): AdminBanner => {
  if (!isAdminBanner(data)) throw new ApiError(500, 'Dữ liệu banner từ API không đúng định dạng.')
  return data
}

export const getAdminBanners = async (signal?: AbortSignal): Promise<AdminBanner[]> => {
  const data: unknown = await apiRequest('/api/admin/banners', { signal })
  if (!Array.isArray(data) || !data.every(isAdminBanner)) {
    throw new ApiError(500, 'Danh sách banner từ API không đúng định dạng.')
  }
  return data
}

export const createAdminBanner = async (input: SaveBannerInput): Promise<AdminBanner> =>
  parseBanner(await apiRequest('/api/admin/banners', { method: 'POST', body: JSON.stringify(input) }))

export const updateAdminBanner = async (id: string, input: SaveBannerInput): Promise<AdminBanner> =>
  parseBanner(await apiRequest(`/api/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(input) }))

export const setAdminBannerActive = async (id: string, isActive: boolean): Promise<AdminBanner> =>
  parseBanner(await apiRequest(`/api/admin/banners/${id}/active`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }))

export const deleteAdminBanner = (id: string) =>
  apiRequest<void>(`/api/admin/banners/${id}`, { method: 'DELETE' })

// Uploads the picture of a banner. The answer holds the address to put in the banner form.
export const uploadAdminBannerImage = async (file: File): Promise<string> => {
  const body = new FormData()
  body.append('file', file)
  const data: unknown = await apiRequest('/api/admin/banners/image', { method: 'POST', body })
  if (!isRecord(data) || typeof data.imageUrl !== 'string') {
    throw new ApiError(500, 'API tải ảnh banner trả về dữ liệu không đúng định dạng.')
  }
  return data.imageUrl
}
