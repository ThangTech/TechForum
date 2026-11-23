export interface CurrentUser {
  id: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  email: string
  roles: string[]
  // False khi tài khoản chỉ đăng nhập bằng Google: trang cá nhân cho đặt mật khẩu thay vì đổi mật khẩu.
  hasPassword: boolean
  isGoogleLinked: boolean
}

// Returned by login, register and refresh. The refresh token is only in an HttpOnly cookie.
export interface AuthSession {
  user: CurrentUser
  accessToken: string
  accessTokenExpiresAtUtc: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterInput {
  displayName: string
  email: string
  password: string
}

export interface UpdateProfileInput {
  displayName: string
  bio: string | null
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
