import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useLocation, useNavigate } from 'react-router-dom'
import { createAuthUrl } from '../auth/returnUrl'

interface AuthRequiredDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthRequiredDialog({ isOpen, onClose }: AuthRequiredDialogProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const returnUrl = `${location.pathname}${location.search}${location.hash}`

  function goTo(path: '/dang-nhap' | '/dang-ky') {
    navigate(createAuthUrl(path, returnUrl))
  }

  return (
    <Dialog
      aria-label="Yêu cầu đăng nhập"
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      purpose="info"
      width={440}
      padding={0}
    >
      <div className="auth-dialog">
        <p className="eyebrow">Tài khoản TechForum</p>
        <h2>Bạn cần đăng nhập để trải nghiệm tính năng này.</h2>
        <p>
          Đăng nhập hoặc tạo tài khoản mới. Sau đó bạn sẽ được đưa về đúng trang
          đang xem.
        </p>
        <div className="auth-dialog__actions">
          <Button label="Đăng nhập" variant="primary" onClick={() => goTo('/dang-nhap')} />
          <Button label="Đăng ký" variant="secondary" onClick={() => goTo('/dang-ky')} />
          <Button label="Để sau" variant="ghost" onClick={onClose} />
        </div>
      </div>
    </Dialog>
  )
}
