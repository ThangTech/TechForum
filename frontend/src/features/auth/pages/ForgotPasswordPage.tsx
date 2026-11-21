import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import background from '../../../assets/background.png'
import { FormTextField } from '../../../shared/components/FormTextField'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { useForgotPasswordPage } from '../hooks/usePasswordRecovery'

export const ForgotPasswordPage = () => {
  const view = useForgotPasswordPage()

  return (
    <AuthPageLayout
      image={background}
      title="Lấy lại quyền truy cập"
      description="Khôi phục mật khẩu bằng email của tài khoản TechForum."
    >
      <form className="auth-form" onSubmit={view.submit}>
        <div>
          <p className="eyebrow">Khôi phục tài khoản</p>
          <h1>Quên mật khẩu</h1>
          <p className="auth-form__lead">
            Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.
          </p>
        </div>
        {view.error && <div className="form-alert" role="alert">{view.error}</div>}
        {view.message && <Alert role="status" severity="success">{view.message}</Alert>}
        <FormTextField
          autoComplete="email"
          control={view.control}
          label="Email"
          name="email"
          required
          rules={{ required: 'Vui lòng nhập email.' }}
          type="email"
        />
        <Button loading={view.isSubmitting} type="submit" variant="contained" fullWidth>Gửi liên kết khôi phục</Button>
        <p className="auth-form__switch">
          <Link to={appRoutes.login}>Quay lại đăng nhập</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
