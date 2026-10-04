import type {
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'
import { ApiError, apiRequest } from './client'

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
    user.roles.every((role) => typeof role === 'string')
  )
}

const requestUser = async (path: string, init?: RequestInit): Promise<CurrentUser> => {
  const data: unknown = await apiRequest(path, init)

  if (!isCurrentUser(data)) {
    throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  }

  return data
}

export const getCurrentUser = (signal?: AbortSignal) => {
  return requestUser('/api/auth/me', { signal })
}

export const login = (input: LoginInput) => {
  return requestUser('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export const register = (input: RegisterInput) => {
  return requestUser('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export const logout = () => {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export const updateProfile = (input: UpdateProfileInput) => {
  return requestUser('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
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
