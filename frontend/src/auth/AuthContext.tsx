import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  changePassword as changePasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  updateAvatar as updateAvatarRequest,
  deleteAvatar as deleteAvatarRequest,
} from '../api/auth'
import { ApiError } from '../api/client'
import type {
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth'
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

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const currentUser = await updateProfileRequest(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    const currentUser = await changePasswordRequest(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const updateAvatar = useCallback(async (file: File) => {
    const currentUser = await updateAvatarRequest(file)
    setUser(currentUser)
    return currentUser
  }, [])

  const deleteAvatar = useCallback(async () => {
    const currentUser = await deleteAvatarRequest()
    setUser(currentUser)
    return currentUser
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, updateProfile, changePassword, updateAvatar, deleteAvatar, logout }),
    [user, isLoading, login, register, updateProfile, changePassword, updateAvatar, deleteAvatar, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
