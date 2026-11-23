import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { useAuth } from './authState'

// Dùng chung cho trang đăng nhập và đăng ký: đổi credential của Google lấy phiên TechForum rồi đi tiếp.
export const useGoogleSignIn = (returnUrl: string) => {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async (credential: string) => {
    setError(null)
    try {
      await loginWithGoogle(credential)
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      setError(getActionError(requestError, 'Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại.'))
    }
  }, [loginWithGoogle, navigate, returnUrl])

  return { error, signIn }
}
