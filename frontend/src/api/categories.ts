export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (configuredBaseUrl || 'http://localhost:5045').replace(/\/$/, '')

function isCategory(value: unknown): value is Category {
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

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/categories`, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new Error('Không thể kết nối tới TechForum API.', { cause: error })
  }

  if (!response.ok) {
    throw new Error(`API trả về mã lỗi ${response.status}.`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data) || !data.every(isCategory)) {
    throw new Error('Dữ liệu chuyên mục từ API không đúng định dạng.')
  }

  return data
}
