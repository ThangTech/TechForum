import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { appRoutes } from '../appRoutes'
import background from '../assets/background.png'
import { AuthPageLayout } from './LoginPage'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      image={background}
      title="Lấy lại quyền truy cập"
      description="Khôi phục mật khẩu bằng email của tài khoản TechForum."
    >
      <form className="auth-form" onSubmit={submit}>
        <div>
          <p className="eyebrow">Khôi phục tài khoản</p>
          <h1>Quên mật khẩu</h1>
          <p className="auth-form__lead">
            Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.
          </p>
        </div>
        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="border border-green-200 bg-green-50 p-4 text-sm text-green-900" role="status">
            {message}
          </div>
        )}
        <TextInput
          autoComplete="email"
          isRequired
          label="Email"
          htmlName="email"
          onChange={setEmail}
          type="email"
          value={email}
          width="100%"
        />
        <Button
          isLoading={isSubmitting}
          label="Gửi liên kết khôi phục"
          type="submit"
          variant="primary"
          width="100%"
        />
        <p className="auth-form__switch">
          <Link to={appRoutes.login}>Quay lại đăng nhập</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}

export const ResetPasswordPage = () => {
  const location = useLocation()
  const parameters = new URLSearchParams(location.hash.slice(1))
  const email = parameters.get('email') ?? ''
  const token = parameters.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    if (password !== confirmation) {
      setError('Hai mật khẩu chưa khớp nhau.')
      return
    }
    if (
      password.length < 8 ||
      password.length > 100 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      setError('Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await resetPassword(email, token, password)
      setIsComplete(true)
      setPassword('')
      setConfirmation('')
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      image={background}
      title="Tạo mật khẩu mới"
      description="Dùng mật khẩu riêng cho TechForum và giữ liên kết khôi phục cho riêng bạn."
    >
      <meta name="referrer" content="no-referrer" />
      <div className="auth-form">
        <div>
          <p className="eyebrow">Khôi phục tài khoản</p>
          <h1>Đặt lại mật khẩu</h1>
        </div>
        {isComplete ? (
          <>
            <p className="border border-green-200 bg-green-50 p-4 text-green-900" role="status">
              Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đã mất hiệu
              lực.
            </p>
            <Link className="font-semibold text-blue-700 underline" to={appRoutes.login}>
              Đăng nhập
            </Link>
          </>
        ) : !email || !token ? (
          <div role="alert">
            <p>Liên kết khôi phục chưa hợp lệ.</p>
            <Link className="font-semibold text-blue-700 underline" to={appRoutes.forgotPassword}>
              Yêu cầu liên kết mới
            </Link>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={submit}>
            <p className="break-all text-sm text-slate-600">Tài khoản: {email}</p>
            <p className="text-sm text-slate-600">
              Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
            </p>
            {error && (
              <div className="form-alert" role="alert">
                {error}
              </div>
            )}
            <TextInput
              autoComplete="new-password"
              isRequired
              label="Mật khẩu mới"
              htmlName="newPassword"
              onChange={setPassword}
              type="password"
              value={password}
              width="100%"
            />
            <TextInput
              autoComplete="new-password"
              isRequired
              label="Nhập lại mật khẩu"
              htmlName="confirmPassword"
              onChange={setConfirmation}
              type="password"
              value={confirmation}
              width="100%"
            />
            <Button
              isLoading={isSubmitting}
              label="Lưu mật khẩu mới"
              type="submit"
              variant="primary"
              width="100%"
            />
            <Link className="text-sm font-semibold text-blue-700 underline" to={appRoutes.forgotPassword}>
              Yêu cầu liên kết mới
            </Link>
          </form>
        )}
      </div>
    </AuthPageLayout>
  )
}
