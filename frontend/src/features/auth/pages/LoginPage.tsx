import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MuiLink from '@mui/material/Link'
import { Controller } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import background from '../../../assets/background.png'
import { FormTextField } from '../../../shared/components/FormTextField'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useLoginPage } from '../hooks/useLoginPage'
import { createAuthUrl } from '../utils/returnUrl'

export const LoginPage = () => {
  const view = useLoginPage()

  if (view.isSignedIn) {
    return <Navigate to={view.returnUrl} replace />
  }

  return (
    <AuthPageLayout
      image={background}
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục trao đổi kiến thức cùng cộng đồng TechForum."
    >
      <form className="auth-form" onSubmit={view.submit} noValidate>
        <div>
          <p className="eyebrow">Đăng nhập</p>
          <h1>Tiếp tục với tài khoản của bạn</h1>
          <p className="auth-form__lead">Đăng nhập để viết bài, đặt câu hỏi và lưu nội dung bạn quan tâm.</p>
        </div>

        {view.notice && !view.error && <Alert role="status" severity="success">{view.notice}</Alert>}
        {view.error && <div className="form-alert" role="alert">{view.error}</div>}

        <FormTextField
          autoComplete="email"
          control={view.control}
          label="Email"
          name="email"
          placeholder="ban@example.com"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          type="email"
        />
        <FormTextField
          autoComplete="current-password"
          control={view.control}
          label="Mật khẩu"
          name="password"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu.' }}
          type="password"
        />
        <Controller
          control={view.control}
          name="rememberMe"
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value} onChange={field.onChange} />}
              label="Duy trì đăng nhập trên thiết bị này"
            />
          )}
        />
        <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">Quên mật khẩu?</MuiLink>
        <Button loading={view.isSubmitting} type="submit" variant="contained" fullWidth>Đăng nhập</Button>
        <GoogleSignInButton text="signin_with" onCredential={view.signInWithGoogle} />

        <p className="auth-form__switch">
          Chưa có tài khoản?{' '}
          <Link to={createAuthUrl(appRoutes.register, view.returnUrl)}>Đăng ký</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
