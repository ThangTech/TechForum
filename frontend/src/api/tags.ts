import { ApiError, apiRequest } from './client'

export interface Tag {
  id: number
  name: string
  slug: string
  description: string | null
}

function isTag(value: unknown): value is Tag {
  if (typeof value !== 'object' || value === null) return false
  const tag = value as Record<string, unknown>
  return (
    typeof tag.id === 'number' &&
    typeof tag.name === 'string' &&
    typeof tag.slug === 'string' &&
    (typeof tag.description === 'string' || tag.description === null)
  )
}

export async function getTags(signal?: AbortSignal): Promise<Tag[]> {
  const data: unknown = await apiRequest('/api/tags', { signal })
  if (!Array.isArray(data) || !data.every(isTag)) {
    throw new ApiError(500, 'Dữ liệu thẻ từ API không đúng định dạng.')
  }
  return data
}
