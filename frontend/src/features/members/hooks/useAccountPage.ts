import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { useAuth } from '../../auth/hooks/authState'

// The account page: the signed-in member, the saves of the forms (avatar, profile, password) and the logout.
export const useAccountPage = () => {
  const { user, updateProfile, changePassword, updateAvatar, deleteAvatar, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logOut = async () => {
    if (isLoggingOut) return
    setLogoutError(null)
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (requestError) {
      setLogoutError(getActionError(requestError, 'Không thể đăng xuất lúc này.'))
    } finally {
      setIsLoggingOut(false)
    }
  }

  const saveProfile = async (displayName: string, bio: string | null) => {
    await updateProfile({ displayName, bio })
  }

  const savePassword = async (currentPassword: string, newPassword: string) => {
    await changePassword({ currentPassword, newPassword })
    // The server signed this account out on every device, so the user logs in again.
    navigate(appRoutes.login, {
      replace: true,
      state: { notice: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.' },
    })
  }

  return {
    user,
    saveProfile,
    savePassword,
    uploadAvatar: updateAvatar,
    deleteAvatar,
    logout: { run: logOut, isBusy: isLoggingOut, error: logoutError },
  }
}
