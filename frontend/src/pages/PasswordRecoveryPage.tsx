import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { appRoutes } from '../appRoutes'
import background from '../assets/background.png'
import { AuthPageLayout } from './LoginPage'
import { FormTextField } from '../components/common/FormTextField'

interface ForgotPasswordFormValues {
  email: string
}

interface ResetPasswordFormValues {
  password: string
  confirmation: string
}

// Quy tắc mật khẩu giống backend: 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
const isStrongPassword = (password: string) =>
  password.length >= 8 &&
  password.length <= 100 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^a-zA-Z0-9]/.test(password)

export const ForgotPasswordPage = () => {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
  })

  const submit = async ({ email }: ForgotPasswordFormValues) => {
    setError(null)
    setMessage(null)
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.',
      )
    }
  }

  return (
    <AuthPageLayout
      image={background}
      title="Lấy lại quyền truy cập"
      description="Khôi phục mật khẩu bằng email của tài khoản TechForum."
    >
      <form className="auth-form" onSubmit={handleSubmit(submit)}>
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
        {message && <Alert role="status" severity="success">{message}</Alert>}
        <FormTextField
          autoComplete="email"
          control={control}
          label="Email"
          name="email"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          type="email"
        />
        <Button loading={isSubmitting} type="submit" variant="contained" fullWidth>Gửi liên kết khôi phục</Button>
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
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', confirmation: '' },
  })

  const submit = async ({ password }: ResetPasswordFormValues) => {
    setError(null)
    try {
      await resetPassword(email, token, password)
      setIsComplete(true)
      reset()
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
      )
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
            <Alert role="status" severity="success">
              Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đã mất hiệu
              lực.
            </Alert>
            <MuiLink component={Link} sx={{ fontWeight: 600 }} to={appRoutes.login} underline="always">
              Đăng nhập
            </MuiLink>
          </>
        ) : !email || !token ? (
          <div role="alert">
            <p>Liên kết khôi phục chưa hợp lệ.</p>
            <MuiLink component={Link} sx={{ fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">
              Yêu cầu liên kết mới
            </MuiLink>
          </div>
        ) : (
          <Stack component="form" noValidate onSubmit={handleSubmit(submit)} spacing={2.5}>
            <Typography color="text.secondary" sx={{ wordBreak: 'break-all' }} variant="body2">Tài khoản: {email}</Typography>
            <Typography color="text.secondary" variant="body2">
              Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
            </Typography>
            {error && (
              <div className="form-alert" role="alert">
                {error}
              </div>
            )}
            <FormTextField
              autoComplete="new-password"
              control={control}
              label="Mật khẩu mới"
              name="password"
              required
              rules={{
                required: 'Vui lòng nhập mật khẩu mới.',
                validate: (value) => isStrongPassword(value) || 'Mật khẩu cần 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
              }}
              type="password"
            />
            <FormTextField
              autoComplete="new-password"
              control={control}
              label="Nhập lại mật khẩu"
              name="confirmation"
              required
              rules={{
                required: 'Vui lòng nhập lại mật khẩu.',
                validate: (value, values) => value === values.password || 'Hai mật khẩu chưa khớp nhau.',
              }}
              type="password"
            />
            <Button loading={isSubmitting} type="submit" variant="contained" fullWidth>Lưu mật khẩu mới</Button>
            <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">
              Yêu cầu liên kết mới
            </MuiLink>
          </Stack>
        )}
      </div>
    </AuthPageLayout>
  )
}
