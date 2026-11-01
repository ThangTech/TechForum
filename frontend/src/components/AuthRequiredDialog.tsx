import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useLocation, useNavigate } from 'react-router-dom'
import { createAuthUrl } from '../auth/returnUrl'
import { appRoutes } from '../appRoutes'

interface AuthRequiredDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthRequiredDialog = ({ isOpen, onClose }: AuthRequiredDialogProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const returnUrl = `${location.pathname}${location.search}${location.hash}`

  const goTo = (path: '/login' | '/register') => {
    navigate(createAuthUrl(path, returnUrl))
  }

  return (
    <Dialog open={isOpen} onClose={() => onClose()} maxWidth={false} slotProps={{ paper: { 'aria-label': "Yêu cầu đăng nhập", sx: { width: 440, maxWidth: 'calc(100% - 32px)' } } }}>
      <div className="auth-dialog">
        <p className="eyebrow">Tài khoản TechForum</p>
        <h2>Bạn cần đăng nhập để trải nghiệm tính năng này.</h2>
        <p>
          Đăng nhập hoặc tạo tài khoản mới. Sau đó bạn sẽ được đưa về đúng trang
          đang xem.
        </p>
        <div className="auth-dialog__actions">
          <Button variant="contained" onClick={() => goTo(appRoutes.login)}>Đăng nhập</Button>
          <Button variant="outlined" onClick={() => goTo(appRoutes.register)}>Đăng ký</Button>
          <Button variant="text" onClick={onClose}>Để sau</Button>
        </div>
      </div>
    </Dialog>
  )
}
