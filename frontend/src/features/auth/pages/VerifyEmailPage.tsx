import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import background from '../../../assets/background.png'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { useVerifyEmailPage } from '../hooks/useEmailVerification'

export const VerifyEmailPage = () => {
  const view = useVerifyEmailPage()

  return (
    <AuthPageLayout
      image={background}
      title="Xác minh email"
      description="Xác minh email để bắt đầu đăng bài, trả lời và bình chọn trên TechForum."
    >
      <meta name="referrer" content="no-referrer" />
      <div className="auth-form">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1>Xác minh email</h1>
        </div>
        {view.status === 'checking' && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }} role="status">
            <CircularProgress size={20} />
            <span>Đang xác minh email...</span>
          </Stack>
        )}
        {view.status === 'verified' && (
          <Alert role="status" severity="success">Email đã được xác minh. Bạn có thể đăng bài, trả lời và bình chọn.</Alert>
        )}
        {view.status === 'failed' && <Alert role="alert" severity="error">{view.error}</Alert>}
        {view.status === 'invalid-link' && (
          <Alert role="alert" severity="error">Link xác minh chưa đầy đủ. Hãy mở đúng link trong email, hoặc gửi lại email từ thanh thông báo đầu trang.</Alert>
        )}
        {view.status !== 'checking' && (
          <MuiLink component={Link} sx={{ fontWeight: 600 }} to={view.isSignedIn ? '/' : appRoutes.login} underline="always">
            {view.isSignedIn ? 'Về trang chủ' : 'Đăng nhập'}
          </MuiLink>
        )}
      </div>
    </AuthPageLayout>
  )
}
