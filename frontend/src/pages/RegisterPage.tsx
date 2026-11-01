import Button from '@mui/material/Button'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { createAuthUrl, getSafeReturnUrl } from '../auth/returnUrl'
import background from '../assets/background.png'
import { AuthPageLayout } from './LoginPage'
import { appRoutes } from '../appRoutes'
import { FormTextField } from '../components/common/FormTextField'

interface RegisterFormValues {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

const fieldError = (error: ApiError | null, name: string) => {
  if (!error) return undefined
  const key = Object.keys(error.fieldErrors).find(
    (field) => field.toLowerCase() === name.toLowerCase(),
  )
  return key ? error.fieldErrors[key]?.join(' ') : undefined
}

export const RegisterPage = () => {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RegisterFormValues>({
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  if (user) {
    return <Navigate to={returnUrl} replace />
  }

  const submitRegister = async ({ displayName, email, password }: RegisterFormValues) => {
    setApiError(null)
    setClientError(null)
    try {
      await register({ displayName, email, password })
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setApiError(requestError)
      } else {
        setClientError('Không thể đăng ký lúc này. Vui lòng thử lại.')
      }
    }
  }

  const generalError = clientError || fieldError(apiError, 'account') || apiError?.message

  return (
    <AuthPageLayout
      image={background}
      title="Tham gia cộng đồng công nghệ"
      description="Tạo hồ sơ TechForum để chia sẻ kinh nghiệm và tham gia thảo luận."
    >
      <form className="auth-form" onSubmit={handleSubmit(submitRegister)} noValidate>
        <div>
          <p className="eyebrow">Đăng ký</p>
          <h1>Tạo tài khoản TechForum</h1>
          <p className="auth-form__lead">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
        </div>

        {generalError && <div className="form-alert" role="alert">{generalError}</div>}

        <FormTextField
          autoComplete="name"
          control={control}
          label="Tên hiển thị"
          name="displayName"
          required
          rules={{ required: 'Vui lòng nhập tên hiển thị.' }}
          serverError={fieldError(apiError, 'displayName')}
        />
        <FormTextField
          autoComplete="email"
          control={control}
          label="Email"
          name="email"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          serverError={fieldError(apiError, 'email')}
          type="email"
        />
        <FormTextField
          autoComplete="new-password"
          control={control}
          label="Mật khẩu"
          name="password"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu.' }}
          serverError={fieldError(apiError, 'password')}
          type="password"
        />
        <FormTextField
          autoComplete="new-password"
          control={control}
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          required
          rules={{
            required: 'Vui lòng nhập lại mật khẩu.',
            validate: (value, values) => value === values.password || 'Mật khẩu xác nhận chưa khớp.',
          }}
          type="password"
        />
        <Button loading={isSubmitting} type="submit" variant="contained" fullWidth>Tạo tài khoản</Button>

        <p className="auth-form__switch">
          Đã có tài khoản?{' '}
          <Link to={createAuthUrl(appRoutes.login, returnUrl)}>Đăng nhập</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
