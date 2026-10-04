import { createContext, useContext } from 'react'
import type {
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'

export interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<CurrentUser>
  register: (input: RegisterInput) => Promise<CurrentUser>
  updateProfile: (input: UpdateProfileInput) => Promise<CurrentUser>
  changePassword: (input: ChangePasswordInput) => Promise<CurrentUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.')
  }
  return context
}
