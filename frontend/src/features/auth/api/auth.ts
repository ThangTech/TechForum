import type {
  AuthSession,
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'
import { ApiError, apiRequest } from '../../../shared/api/client'
import type { ApiRequestInit } from '../../../shared/types/client'

const isCurrentUser = (value: unknown): value is CurrentUser => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.displayName === 'string' &&
    (user.bio === null || typeof user.bio === 'string') &&
    (user.avatarUrl === null || typeof user.avatarUrl === 'string') &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string') &&
    typeof user.hasPassword === 'boolean' &&
    typeof user.isGoogleLinked === 'boolean' &&
    typeof user.emailVerified === 'boolean'
  )
}

const isAuthSession = (value: unknown): value is AuthSession => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Record<string, unknown>
  return (
    isCurrentUser(session.user) &&
    typeof session.accessToken === 'string' &&
    session.accessToken.length > 0 &&
    typeof session.accessTokenExpiresAtUtc === 'string' &&
    !Number.isNaN(Date.parse(session.accessTokenExpiresAtUtc))
  )
}

const requestUser = async (path: string, init?: ApiRequestInit): Promise<CurrentUser> => {
  const data: unknown = await apiRequest(path, init)

  if (!isCurrentUser(data)) {
    throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  }

  return data
}

// Login, register and refresh answer with an access token. They never send a Bearer token themselves.
const requestSession = async (path: string, init: ApiRequestInit): Promise<AuthSession> => {
  const data: unknown = await apiRequest(path, { ...init, skipAuth: true })

  if (!isAuthSession(data)) {
    throw new ApiError(500, 'Dữ liệu phiên đăng nhập từ API không đúng định dạng.')
  }

  return data
}

export const getCurrentUser = (signal?: AbortSignal) => {
  return requestUser('/api/auth/me', { signal })
}

export const login = (input: LoginInput) => {
  return requestSession('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// credential: ID token mà nút Google trả về; API tự kiểm tra với Google rồi cấp phiên như đăng nhập thường.
export const loginWithGoogle = (credential: string) => {
  return requestSession('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export const register = (input: RegisterInput) => {
  return requestSession('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// The browser sends the refresh cookie; the body is empty.
export const refreshSession = () => {
  return requestSession('/api/auth/refresh', { method: 'POST' })
}

export const logout = () => {
  return apiRequest<void>('/api/auth/logout', { method: 'POST', skipAuth: true })
}

// Thu hồi mọi phiên đăng nhập của tài khoản, trên mọi thiết bị.
export const logoutEverywhere = () => apiRequest<void>('/api/auth/logout-all', { method: 'POST' })

// Xoá tài khoản: cần gõ "XÓA" và mật khẩu (nếu tài khoản có mật khẩu).
export const closeAccount = (password: string | null, confirmation: string) => apiRequest<void>('/api/auth/account', {
  method: 'DELETE',
  body: JSON.stringify({ password, confirmation }),
})

export const updateProfile = (input: UpdateProfileInput) => {
  return requestUser('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// Đặt mật khẩu lần đầu cho tài khoản chưa có (tài khoản Google), nên không gửi mật khẩu hiện tại.
export const setPassword = (newPassword: string) => {
  return requestUser('/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}

export const changePassword = (input: ChangePasswordInput) => {
  return requestUser('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export const updateAvatar = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return requestUser('/api/auth/avatar', { method: 'POST', body })
}

export const deleteAvatar = () => requestUser('/api/auth/avatar', { method: 'DELETE' })

// Gửi lại email xác minh cho tài khoản đang đăng nhập.
export const resendEmailVerification = () => apiRequest<void>('/api/auth/email-verification', { method: 'POST' })

// userId và token lấy từ link trong email; không cần đăng nhập để mở link trên thiết bị khác.
export const confirmEmail = (userId: string, token: string) => apiRequest<void>('/api/auth/email-verification/confirm', {
  method: 'POST', body: JSON.stringify({ userId, token }),
})

export const requestPasswordReset = (email: string) => apiRequest<{ message: string }>('/api/auth/forgot-password', {
  method: 'POST', body: JSON.stringify({ email }),
})

export const resetPassword = (email: string, token: string, newPassword: string) => apiRequest<void>('/api/auth/reset-password', {
  method: 'POST', body: JSON.stringify({ email, token, newPassword }),
})
