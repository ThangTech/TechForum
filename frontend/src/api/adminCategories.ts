import { ApiError, apiRequest } from './client'

export interface AdminCategory {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
  isActive: boolean
  topicCount: number
}

export interface SaveCategoryInput {
  name: string
  slug: string
  description: string | null
  displayOrder: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAdminCategory = (value: unknown): value is AdminCategory =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.name === 'string' &&
  typeof value.slug === 'string' &&
  (value.description === null || typeof value.description === 'string') &&
  typeof value.displayOrder === 'number' &&
  typeof value.isActive === 'boolean' &&
  typeof value.topicCount === 'number'

const parseCategory = (data: unknown): AdminCategory => {
  if (!isAdminCategory(data)) {
    throw new ApiError(500, 'Dữ liệu chuyên mục từ API không đúng định dạng.')
  }
  return data
}

export const getAdminCategories = async (signal?: AbortSignal): Promise<AdminCategory[]> => {
  const data: unknown = await apiRequest('/api/admin/categories', { signal })
  if (!Array.isArray(data) || !data.every(isAdminCategory)) {
    throw new ApiError(500, 'Danh sách chuyên mục từ API không đúng định dạng.')
  }
  return data
}

export const createAdminCategory = async (input: SaveCategoryInput): Promise<AdminCategory> =>
  parseCategory(await apiRequest('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  }))

export const updateAdminCategory = async (
  id: number,
  input: SaveCategoryInput,
): Promise<AdminCategory> => parseCategory(await apiRequest(`/api/admin/categories/${id}`, {
  method: 'PUT',
  body: JSON.stringify(input),
}))

export const setAdminCategoryActive = async (
  id: number,
  isActive: boolean,
): Promise<AdminCategory> => parseCategory(await apiRequest(`/api/admin/categories/${id}/active`, {
  method: 'PUT',
  body: JSON.stringify({ isActive }),
}))
