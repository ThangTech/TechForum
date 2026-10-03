import { Button } from '@astryxdesign/core/Button'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl, getSafeReturnUrl } from '../auth/returnUrl'
import background from '../assets/background.png'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to={returnUrl} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password, rememberMe })
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể đăng nhập lúc này. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageLayout
      image={background}
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục trao đổi kiến thức cùng cộng đồng TechForum."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="eyebrow">Đăng nhập</p>
          <h1>Tiếp tục với tài khoản của bạn</h1>
          <p className="auth-form__lead">Thông tin đăng nhập được gửi trực tiếp tới TechForum API.</p>
        </div>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <TextInput
          autoComplete="email"
          isRequired
          label="Email"
          htmlName="email"
          onChange={setEmail}
          placeholder="ban@example.com"
          type="email"
          value={email}
          width="100%"
        />
        <TextInput
          autoComplete="current-password"
          isRequired
          label="Mật khẩu"
          htmlName="password"
          onChange={setPassword}
          type="password"
          value={password}
          width="100%"
        />
        <CheckboxInput
          label="Duy trì đăng nhập trên thiết bị này"
          onChange={setRememberMe}
          value={rememberMe}
        />
        <Button
          isLoading={isSubmitting}
          label="Đăng nhập"
          type="submit"
          variant="primary"
          width="100%"
        />

        <p className="auth-form__switch">
          Chưa có tài khoản?{' '}
          <Link to={createAuthUrl('/dang-ky', returnUrl)}>Đăng ký</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}

interface AuthPageLayoutProps {
  image: string
  title: string
  description: string
  children: ReactNode
}

export function AuthPageLayout({ image, title, description, children }: AuthPageLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Giới thiệu TechForum">
        <Link className="auth-visual__brand" to="/">Tech<span>Forum</span></Link>
        <div className="auth-visual__copy">
          <img src={image} alt="Cộng đồng cùng trao đổi kiến thức công nghệ" />
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </section>
      <section className="auth-form-panel">{children}</section>
    </main>
  )
}
