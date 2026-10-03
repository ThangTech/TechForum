import { createContext, useContext } from 'react'
import type { CurrentUser, LoginInput, RegisterInput } from '../types/auth'

export interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<CurrentUser>
  register: (input: RegisterInput) => Promise<CurrentUser>
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
