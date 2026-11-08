import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MuiLink from '@mui/material/Link'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl, getSafeReturnUrl } from '../auth/returnUrl'
import background from '../assets/background.png'
import { appRoutes } from '../appRoutes'
import { FormTextField } from '../components/common/FormTextField'

interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

// Other pages can send a message to show on the login page, for example after a password change.
const getNotice = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('notice' in state)) {
    return null
  }

  return typeof state.notice === 'string' ? state.notice : null
}

export const LoginPage = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const notice = getNotice(location.state)
  const [error, setError] = useState<string | null>(null)
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  if (user) {
    return <Navigate to={returnUrl} replace />
  }

  const submitLogin = async (values: LoginFormValues) => {
    setError(null)
    try {
      await login(values)
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể đăng nhập lúc này. Vui lòng thử lại.',
      )
    }
  }

  return (
    <AuthPageLayout
      image={background}
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục trao đổi kiến thức cùng cộng đồng TechForum."
    >
      <form className="auth-form" onSubmit={handleSubmit(submitLogin)} noValidate>
        <div>
          <p className="eyebrow">Đăng nhập</p>
          <h1>Tiếp tục với tài khoản của bạn</h1>
          <p className="auth-form__lead">Đăng nhập để viết bài, đặt câu hỏi và lưu nội dung bạn quan tâm.</p>
        </div>

        {notice && !error && <Alert role="status" severity="success">{notice}</Alert>}
        {error && <div className="form-alert" role="alert">{error}</div>}

        <FormTextField
          autoComplete="email"
          control={control}
          label="Email"
          name="email"
          placeholder="ban@example.com"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          type="email"
        />
        <FormTextField
          autoComplete="current-password"
          control={control}
          label="Mật khẩu"
          name="password"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu.' }}
          type="password"
        />
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value} onChange={field.onChange} />}
              label="Duy trì đăng nhập trên thiết bị này"
            />
          )}
        />
        <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">Quên mật khẩu?</MuiLink>
        <Button loading={isSubmitting} type="submit" variant="contained" fullWidth>Đăng nhập</Button>

        <p className="auth-form__switch">
          Chưa có tài khoản?{' '}
          <Link to={createAuthUrl(appRoutes.register, returnUrl)}>Đăng ký</Link>
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

export const AuthPageLayout = ({ image, title, description, children }: AuthPageLayoutProps) => {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Giới thiệu TechForum">
        <Link className="auth-visual__brand" to={appRoutes.home}>Tech<span>Forum</span></Link>
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
