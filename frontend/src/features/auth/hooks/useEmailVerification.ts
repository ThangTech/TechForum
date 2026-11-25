import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { confirmEmail, resendEmailVerification } from '../api/auth'
import { useAuth } from './authState'

// Thanh nhắc xác minh email ở đầu trang: chỉ hiện với tài khoản đã đăng nhập mà chưa xác minh.
export const useEmailVerificationBanner = () => {
  const { user } = useAuth()
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

  return {
    isVisible: user !== null && !user.emailVerified,
    email: user?.email ?? '',
    isSending,
    message,
    error,
    resend,
  }
}

type VerifyStatus = 'checking' | 'verified' | 'failed' | 'invalid-link'

// Trang mở từ link trong email. userId và token nằm sau dấu # nên trình duyệt không gửi chúng lên máy chủ hay theo Referer.
export const useVerifyEmailPage = () => {
  const location = useLocation()
  const { user, reloadCurrentUser } = useAuth()
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
      .then(async () => {
        setStatus('verified')
        // Người đang đăng nhập thấy ngay quyền đăng bài, không phải tải lại trang.
        if (isSignedIn) await reloadCurrentUser().catch(() => undefined)
      })
      .catch((requestError: unknown) => {
        setError(getActionError(requestError, 'Link xác minh không hợp lệ hoặc đã hết hạn.'))
        setStatus('failed')
      })
  }, [hasLink, isSignedIn, reloadCurrentUser, token, userId])

  return { status, error, isSignedIn }
}
