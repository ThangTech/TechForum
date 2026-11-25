import { useShallow } from 'zustand/react/shallow'
import {
  changePassword,
  deleteAvatar,
  login,
  loginWithGoogle,
  logout,
  register,
  reloadCurrentUser,
  setPassword,
  updateAvatar,
  updateProfile,
} from '../api/authActions'
import { useAuthStore } from '../store/authStore'

// Components read the signed-in user here. The access token is not exposed to components.
export const useAuth = () => {
  const { user, isLoading } = useAuthStore(
    useShallow((state) => ({ user: state.user, isLoading: state.isLoading })),
  )

  return {
    user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    updateProfile,
    changePassword,
    setPassword,
    reloadCurrentUser,
    updateAvatar,
    deleteAvatar,
    logout,
  }
}
