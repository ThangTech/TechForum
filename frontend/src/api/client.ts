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

export interface ApiRequestInit extends RequestInit {
  // Login, register, refresh and logout must not send a Bearer token or retry after a 401.
  skipAuth?: boolean
}

// The session module registers these, so the client does not need to know where the token is kept.
export interface ApiAuthHandlers {
  // Resolves to the current access token. It waits while the first session restore is running.
  getAccessToken: () => Promise<string | null>
  // Gets a new access token with the refresh cookie. Resolves to null when the user is signed out.
  refreshAccessToken: () => Promise<string | null>
}

let authHandlers: ApiAuthHandlers | null = null

export const configureApiAuth = (handlers: ApiAuthHandlers | null) => {
  authHandlers = handlers
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

const sendRequest = async (
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<Response> => {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  try {
    // credentials: include sends the HttpOnly refresh cookie to /api/auth/refresh and /api/auth/logout.
    return await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(0, 'Không thể kết nối tới TechForum. Vui lòng thử lại.')
  }
}

export const apiRequest = async <T>(path: string, init: ApiRequestInit = {}): Promise<T> => {
  const { skipAuth = false, ...fetchInit } = init
  const handlers = skipAuth ? null : authHandlers

  const accessToken = handlers ? await handlers.getAccessToken() : null
  let response = await sendRequest(path, fetchInit, accessToken)

  // An expired access token: get a new one once and send the same request again.
  if (response.status === 401 && handlers) {
    const refreshedToken = await handlers.refreshAccessToken()
    if (refreshedToken && refreshedToken !== accessToken) {
      response = await sendRequest(path, fetchInit, refreshedToken)
    }
  }

  if (!response.ok) {
    throw toApiError(response, await readProblem(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
