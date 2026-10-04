export interface CurrentUser {
  id: string
  displayName: string
  bio: string | null
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
  bio: string | null
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
