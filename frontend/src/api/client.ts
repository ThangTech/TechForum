const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const apiBaseUrl = (configuredBaseUrl || 'http://localhost:5045').replace(/\/$/, '')

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const readProblem = async (response: Response): Promise<ProblemDetails | null> => {
  const contentType = response.headers.get('content-type')
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json' && !mediaType?.endsWith('+json')) {
    return null
  }

  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return null
  }
}

const toApiError = (response: Response, problem: ProblemDetails | null) => {
  const message =
    problem?.detail || problem?.title || `API trả về mã lỗi ${response.status}.`
  return new ApiError(response.status, message, problem?.errors)
}

const getAntiforgeryToken = async (): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}/api/auth/antiforgery-token`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw toApiError(response, await readProblem(response))
  }

  const data = (await response.json()) as { token?: unknown }
  if (typeof data.token !== 'string' || data.token.length === 0) {
    throw new ApiError(500, 'API không trả về mã bảo vệ biểu mẫu hợp lệ.')
  }

  return data.token
}

export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const method = (init.method || 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-TOKEN', await getAntiforgeryToken())
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(0, 'Không thể kết nối tới TechForum API.')
  }

  if (!response.ok) {
    throw toApiError(response, await readProblem(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
