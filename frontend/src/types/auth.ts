export interface CurrentUser {
  id: string
  displayName: string
  email: string
  roles: string[]
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
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
