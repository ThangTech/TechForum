import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { confirmEmail, resendEmailVerification } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { CurrentUser } from '../types/auth'
import { useAuth } from './authState'

// Thanh nhắc xác minh email ở đầu trang: chỉ hiện với tài khoản đã đăng nhập mà chưa xác minh.
export const useEmailVerificationBanner = () => {
  const { user, reloadCurrentUser } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resend = async () => {
    if (isSending) return
    setIsSending(true)
    setMessage(null)
    setError(null)
    try {
      await resendEmailVerification()
      setMessage('Đã gửi lại email xác minh. Hãy kiểm tra cả thư mục Spam.')
    } catch (requestError) {
      setError(getActionError(requestError, 'Chưa gửi lại được email xác minh. Vui lòng thử lại sau.'))
    } finally {
      setIsSending(false)
    }
  }

  // Link xác minh thường mở ở tab khác: quay lại tab này thì đọc lại tài khoản để thanh nhắc tự biến mất.
  const isUnverified = user !== null && !user.emailVerified
  useEffect(() => {
    if (!isUnverified) return
    const reloadWhenVisible = () => {
      if (document.visibilityState === 'visible') void reloadCurrentUser().catch(() => undefined)
    }
    // focus: hai cửa sổ đặt cạnh nhau thì không có visibilitychange khi bấm sang.
    document.addEventListener('visibilitychange', reloadWhenVisible)
    window.addEventListener('focus', reloadWhenVisible)
    return () => {
      document.removeEventListener('visibilitychange', reloadWhenVisible)
      window.removeEventListener('focus', reloadWhenVisible)
    }
  }, [isUnverified, reloadCurrentUser])

  return {
    isVisible: isUnverified,
    email: user?.email ?? '',
    isSending,
    message,
    error,
    resend,
  }
}

type VerifyStatus = 'checking' | 'verified' | 'failed' | 'invalid-link'

// Phiên đăng nhập được khôi phục song song với việc xác minh, nên có thể mang về trạng thái "chưa xác minh" cũ.
// Khi đó cần sửa lại tài khoản đang lưu thì thanh nhắc mới mất ngay.
export const needsVerifiedMark = (status: VerifyStatus, isLoading: boolean, user: CurrentUser | null): boolean =>
  status === 'verified' && !isLoading && user !== null && !user.emailVerified

// Trang mở từ link trong email. userId và token nằm sau dấu # nên trình duyệt không gửi chúng lên máy chủ hay theo Referer.
export const useVerifyEmailPage = () => {
  const location = useLocation()
  const { user, isLoading, reloadCurrentUser } = useAuth()
  const parameters = new URLSearchParams(location.hash.slice(1))
  const userId = parameters.get('userId') ?? ''
  const token = parameters.get('token') ?? ''
  const hasLink = userId !== '' && token !== ''
  const [status, setStatus] = useState<VerifyStatus>(hasLink ? 'checking' : 'invalid-link')
  const [error, setError] = useState<string | null>(null)
  // React gọi effect hai lần khi phát triển; link chỉ cần gửi một lần.
  const sent = useRef(false)
  const isSignedIn = user !== null

  useEffect(() => {
    if (!hasLink || sent.current) return
    sent.current = true
    confirmEmail(userId, token)
      .then(() => setStatus('verified'))
      .catch((requestError: unknown) => {
        setError(getActionError(requestError, 'Link xác minh không hợp lệ hoặc đã hết hạn.'))
        setStatus('failed')
      })
  }, [hasLink, token, userId])

  // Người đang đăng nhập thấy ngay quyền đăng bài (thanh nhắc mất), không phải tải lại trang.
  // Chờ khôi phục phiên xong mới sửa, để phiên vừa khôi phục không ghi đè lại trạng thái cũ.
  const reloaded = useRef(false)
  useEffect(() => {
    if (!user || !needsVerifiedMark(status, isLoading, user)) return
    useAuthStore.getState().setUser({ ...user, emailVerified: true })
    if (reloaded.current) return
    reloaded.current = true
    void reloadCurrentUser().catch(() => undefined)
  }, [isLoading, reloadCurrentUser, status, user])

  return { status, error, isSignedIn }
}
