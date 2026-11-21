import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import background from '../../../assets/background.png'
import { FormTextField } from '../../../shared/components/FormTextField'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { useResetPasswordPage } from '../hooks/usePasswordRecovery'
import { isStrongPassword, passwordRuleMessage } from '../utils/passwordRules'

export const ResetPasswordPage = () => {
  const view = useResetPasswordPage()

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
        {view.isComplete ? (
          <>
            <Alert role="status" severity="success">
              Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đã mất hiệu
              lực.
            </Alert>
            <MuiLink component={Link} sx={{ fontWeight: 600 }} to={appRoutes.login} underline="always">
              Đăng nhập
            </MuiLink>
          </>
        ) : !view.hasValidLink ? (
          <div role="alert">
            <p>Liên kết khôi phục chưa hợp lệ.</p>
            <MuiLink component={Link} sx={{ fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">
              Yêu cầu liên kết mới
            </MuiLink>
          </div>
        ) : (
          <Stack component="form" noValidate onSubmit={view.submit} spacing={2.5}>
            <Typography color="text.secondary" sx={{ wordBreak: 'break-all' }} variant="body2">Tài khoản: {view.email}</Typography>
            <Typography color="text.secondary" variant="body2">{passwordRuleMessage}</Typography>
            {view.error && <div className="form-alert" role="alert">{view.error}</div>}
            <FormTextField
              autoComplete="new-password"
              control={view.control}
              label="Mật khẩu mới"
              name="password"
              required
              rules={{
                required: 'Vui lòng nhập mật khẩu mới.',
                validate: (value) => isStrongPassword(value) || passwordRuleMessage,
              }}
              type="password"
            />
            <FormTextField
              autoComplete="new-password"
              control={view.control}
              label="Nhập lại mật khẩu"
              name="confirmation"
              required
              rules={{
                required: 'Vui lòng nhập lại mật khẩu.',
                validate: (value, values) => value === values.password || 'Hai mật khẩu chưa khớp nhau.',
              }}
              type="password"
            />
            <Button loading={view.isSubmitting} type="submit" variant="contained" fullWidth>Lưu mật khẩu mới</Button>
            <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to={appRoutes.forgotPassword} underline="always">
              Yêu cầu liên kết mới
            </MuiLink>
          </Stack>
        )}
      </div>
    </AuthPageLayout>
  )
}
