import Button from '@mui/material/Button'
import { Link, Navigate } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import background from '../../../assets/background.png'
import { FormTextField } from '../../../shared/components/FormTextField'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useRegisterPage } from '../hooks/useRegisterPage'
import { createAuthUrl } from '../utils/returnUrl'

export const RegisterPage = () => {
  const view = useRegisterPage()

  if (view.isSignedIn) {
    return <Navigate to={view.returnUrl} replace />
  }

  return (
    <AuthPageLayout
      image={background}
      title="Tham gia cộng đồng công nghệ"
      description="Tạo hồ sơ TechForum để chia sẻ kinh nghiệm và tham gia thảo luận."
    >
      <form className="auth-form" onSubmit={view.submit} noValidate>
        <div>
          <p className="eyebrow">Đăng ký</p>
          <h1>Tạo tài khoản TechForum</h1>
          <p className="auth-form__lead">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
        </div>

        {view.generalError && <div className="form-alert" role="alert">{view.generalError}</div>}

        <FormTextField
          autoComplete="name"
          control={view.control}
          label="Tên hiển thị"
          name="displayName"
          required
          rules={{ required: 'Vui lòng nhập tên hiển thị.' }}
          serverError={view.fieldError('displayName')}
        />
        <FormTextField
          autoComplete="email"
          control={view.control}
          label="Email"
          name="email"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          serverError={view.fieldError('email')}
          type="email"
        />
        <FormTextField
          autoComplete="new-password"
          control={view.control}
          label="Mật khẩu"
          name="password"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu.' }}
          serverError={view.fieldError('password')}
          type="password"
        />
        <FormTextField
          autoComplete="new-password"
          control={view.control}
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          required
          rules={{
            required: 'Vui lòng nhập lại mật khẩu.',
            validate: (value, values) => value === values.password || 'Mật khẩu xác nhận chưa khớp.',
          }}
          type="password"
        />
        <Button loading={view.isSubmitting} type="submit" variant="contained" fullWidth>Tạo tài khoản</Button>
        <GoogleSignInButton text="signup_with" onCredential={view.signInWithGoogle} />

        <p className="auth-form__legal">
          Khi đăng ký, bạn đồng ý với <Link to={appRoutes.terms}>Điều khoản sử dụng</Link> và{' '}
          <Link to={appRoutes.privacy}>Chính sách bảo mật</Link> của TechForum.
        </p>

        <p className="auth-form__switch">
          Đã có tài khoản?{' '}
          <Link to={createAuthUrl(appRoutes.login, view.returnUrl)}>Đăng nhập</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
