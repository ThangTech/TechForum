import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl, getSafeReturnUrl } from '../auth/returnUrl'
import background from '../assets/background.png'
import { AuthPageLayout } from './LoginPage'

function fieldError(error: ApiError | null, name: string) {
  if (!error) return undefined
  const key = Object.keys(error.fieldErrors).find(
    (field) => field.toLowerCase() === name.toLowerCase(),
  )
  return key ? error.fieldErrors[key]?.join(' ') : undefined
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to={returnUrl} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setApiError(null)
    setClientError(null)
    if (password !== confirmPassword) {
      setClientError('Mật khẩu xác nhận chưa khớp.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ displayName, email, password })
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setApiError(requestError)
      } else {
        setClientError('Không thể đăng ký lúc này. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const generalError = clientError || fieldError(apiError, 'account') || apiError?.message

  return (
    <AuthPageLayout
      image={background}
      title="Tham gia cộng đồng công nghệ"
      description="Tạo hồ sơ TechForum để chia sẻ kinh nghiệm và tham gia thảo luận."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="eyebrow">Đăng ký</p>
          <h1>Tạo tài khoản TechForum</h1>
          <p className="auth-form__lead">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
        </div>

        {generalError && <div className="form-alert" role="alert">{generalError}</div>}

        <TextInput
          autoComplete="name"
          isRequired
          label="Tên hiển thị"
          htmlName="displayName"
          onChange={setDisplayName}
          status={fieldError(apiError, 'displayName') ? { type: 'error', message: fieldError(apiError, 'displayName') } : undefined}
          value={displayName}
          width="100%"
        />
        <TextInput
          autoComplete="email"
          isRequired
          label="Email"
          htmlName="email"
          onChange={setEmail}
          status={fieldError(apiError, 'email') ? { type: 'error', message: fieldError(apiError, 'email') } : undefined}
          type="email"
          value={email}
          width="100%"
        />
        <TextInput
          autoComplete="new-password"
          isRequired
          label="Mật khẩu"
          htmlName="password"
          onChange={setPassword}
          status={fieldError(apiError, 'password') ? { type: 'error', message: fieldError(apiError, 'password') } : undefined}
          type="password"
          value={password}
          width="100%"
        />
        <TextInput
          autoComplete="new-password"
          isRequired
          label="Xác nhận mật khẩu"
          htmlName="confirmPassword"
          onChange={setConfirmPassword}
          status={clientError ? { type: 'error', message: clientError } : undefined}
          type="password"
          value={confirmPassword}
          width="100%"
        />
        <Button
          isLoading={isSubmitting}
          label="Tạo tài khoản"
          type="submit"
          variant="primary"
          width="100%"
        />

        <p className="auth-form__switch">
          Đã có tài khoản?{' '}
          <Link to={createAuthUrl('/dang-nhap', returnUrl)}>Đăng nhập</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
