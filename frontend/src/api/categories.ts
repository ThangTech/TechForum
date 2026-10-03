import { apiRequest } from './client'

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
}

const isCategory = (value: unknown): value is Category => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const category = value as Record<string, unknown>
  return (
    typeof category.id === 'number' &&
    typeof category.name === 'string' &&
    typeof category.slug === 'string' &&
    (typeof category.description === 'string' || category.description === null) &&
    typeof category.displayOrder === 'number'
  )
}

export const getCategories = async (signal?: AbortSignal): Promise<Category[]> => {
  const data: unknown = await apiRequest('/api/categories', { signal })
  if (!Array.isArray(data) || !data.every(isCategory)) {
    throw new Error('Dữ liệu chuyên mục từ API không đúng định dạng.')
  }

  return data
}
