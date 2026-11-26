import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { useAuth } from '../../auth/hooks/authState'

// The account page: the signed-in member, the saves of the forms (avatar, profile, password) and the logout.
export const useAccountPage = () => {
  const { user, updateProfile, changePassword, setPassword, updateAvatar, deleteAvatar, logout, logoutEverywhere, closeAccount } = useAuth()
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

  const [isEverywhereBusy, setIsEverywhereBusy] = useState(false)
  const signOutEverywhere = async () => {
    if (isEverywhereBusy) return
    setLogoutError(null)
    setIsEverywhereBusy(true)
    try {
      await logoutEverywhere()
      navigate(appRoutes.login, { replace: true, state: { notice: 'Đã đăng xuất khỏi mọi thiết bị. Vui lòng đăng nhập lại.' } })
    } catch (requestError) {
      setLogoutError(getActionError(requestError, 'Không thể đăng xuất khỏi mọi thiết bị lúc này.'))
    } finally {
      setIsEverywhereBusy(false)
    }
  }

  // Lỗi (sai mật khẩu, chưa gõ XÓA...) được hộp thoại hiện ra, nên ở đây chỉ chuyển trang khi xong.
  const deleteAccount = async (password: string | null, confirmation: string) => {
    await closeAccount(password, confirmation)
    navigate('/', { replace: true })
  }

  const saveProfile = async (displayName: string, bio: string | null) => {
    await updateProfile({ displayName, bio })
  }

  // Tài khoản chưa có mật khẩu (tài khoản Google) thì đặt mật khẩu, không cần mật khẩu hiện tại.
  const hasPassword = user?.hasPassword ?? true

  const savePassword = async (currentPassword: string, newPassword: string) => {
    if (hasPassword) {
      await changePassword({ currentPassword, newPassword })
    } else {
      await setPassword(newPassword)
    }
    // Server đã đăng xuất tài khoản trên mọi thiết bị, nên người dùng đăng nhập lại.
    navigate(appRoutes.login, {
      replace: true,
      state: {
        notice: hasPassword
          ? 'Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.'
          : 'Đã đặt mật khẩu. Giờ bạn đăng nhập được bằng email và mật khẩu hoặc bằng Google.',
      },
    })
  }

  const signInMethods = [hasPassword ? 'Email và mật khẩu' : null, user?.isGoogleLinked ? 'Google' : null]
    .filter((method) => method !== null)
    .join(', ')

  return {
    user,
    saveProfile,
    savePassword,
    hasPassword,
    signInMethods,
    uploadAvatar: updateAvatar,
    deleteAvatar,
    logout: { run: logOut, isBusy: isLoggingOut, error: logoutError },
    logoutEverywhere: { run: signOutEverywhere, isBusy: isEverywhereBusy },
    deleteAccount,
    isAdministrator: user?.roles.includes('Administrator') ?? false,
  }
}
