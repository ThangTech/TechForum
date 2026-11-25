import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  deleteAvatar as deleteAvatarRequest,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logout as logoutRequest,
  register as registerRequest,
  setPassword as setPasswordRequest,
  updateAvatar as updateAvatarRequest,
  updateProfile as updateProfileRequest,
} from './auth'
import type {
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'
import { useAuthStore } from '../store/authStore'

export const login = async (input: LoginInput): Promise<CurrentUser> => {
  const session = await loginRequest(input)
  useAuthStore.getState().setSession(session)
  return session.user
}

export const loginWithGoogle = async (credential: string): Promise<CurrentUser> => {
  const session = await loginWithGoogleRequest(credential)
  useAuthStore.getState().setSession(session)
  return session.user
}

export const register = async (input: RegisterInput): Promise<CurrentUser> => {
  const session = await registerRequest(input)
  useAuthStore.getState().setSession(session)
  return session.user
}

export const logout = async (): Promise<void> => {
  try {
    await logoutRequest()
  } finally {
    // The local session is cleared even if the server cannot be reached.
    useAuthStore.getState().clearSession()
  }
}

export const updateProfile = async (input: UpdateProfileInput): Promise<CurrentUser> => {
  const user = await updateProfileRequest(input)
  useAuthStore.getState().setUser(user)
  return user
}

export const changePassword = async (input: ChangePasswordInput): Promise<CurrentUser> => {
  const user = await changePasswordRequest(input)
  // The server signs the account out on every device after a password change.
  useAuthStore.getState().clearSession()
  return user
}

export const setPassword = async (newPassword: string): Promise<CurrentUser> => {
  const user = await setPasswordRequest(newPassword)
  // Giống đổi mật khẩu: server đăng xuất tài khoản trên mọi thiết bị.
  useAuthStore.getState().clearSession()
  return user
}

// Đọc lại thông tin tài khoản từ API, ví dụ sau khi email vừa được xác minh.
export const reloadCurrentUser = async (): Promise<CurrentUser> => {
  const user = await getCurrentUser()
  useAuthStore.getState().setUser(user)
  return user
}

export const updateAvatar = async (file: File): Promise<CurrentUser> => {
  const user = await updateAvatarRequest(file)
  useAuthStore.getState().setUser(user)
  return user
}

export const deleteAvatar = async (): Promise<CurrentUser> => {
  const user = await deleteAvatarRequest()
  useAuthStore.getState().setUser(user)
  return user
}
