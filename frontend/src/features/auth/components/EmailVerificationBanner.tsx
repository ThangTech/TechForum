import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { useEmailVerificationBanner } from '../hooks/useEmailVerification'

export const EmailVerificationBanner = () => {
  const view = useEmailVerificationBanner()
  if (!view.isVisible) return null

  return (
    <Alert
      severity="warning"
      role="status"
      sx={{ borderRadius: 0, alignItems: 'center' }}
      action={<Button color="inherit" loading={view.isSending} onClick={() => void view.resend()} size="small">Gửi lại email</Button>}
    >
      {view.message ?? view.error ?? `Email ${view.email} chưa được xác minh. Mở link trong email để bắt đầu đăng bài, trả lời và bình chọn.`}
    </Alert>
  )
}
