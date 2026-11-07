import { useShallow } from 'zustand/react/shallow'
import {
  changePassword,
  deleteAvatar,
  login,
  logout,
  register,
  updateAvatar,
  updateProfile,
} from './authActions'
import { useAuthStore } from './authStore'

// Components read the signed-in user here. The access token is not exposed to components.
export const useAuth = () => {
  const { user, isLoading } = useAuthStore(
    useShallow((state) => ({ user: state.user, isLoading: state.isLoading })),
  )

  return {
    user,
    isLoading,
    login,
    register,
    updateProfile,
    changePassword,
    updateAvatar,
    deleteAvatar,
    logout,
  }
}
