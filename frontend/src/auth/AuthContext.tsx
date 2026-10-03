import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/auth'
import { ApiError } from '../api/client'
import type { CurrentUser, LoginInput, RegisterInput } from '../types/auth'
import { AuthContext } from './authState'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCurrentUser(controller.signal)
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error('Không thể kiểm tra phiên đăng nhập.', error)
        }
        setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const currentUser = await loginRequest(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const currentUser = await registerRequest(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
