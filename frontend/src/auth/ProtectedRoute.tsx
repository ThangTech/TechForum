import Typography from '@mui/material/Typography'
import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthRequiredDialog } from '../components/AuthRequiredDialog'
import { PageShell } from '../components/common/PageShell'
import { Panel } from '../components/common/Panel'
import { useAuth } from './authState'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(true)

  if (isLoading) {
    return <div className="route-status" role="status">Đang kiểm tra phiên đăng nhập…</div>
  }

  if (user && (!requiredRole || user.roles.includes(requiredRole))) {
    return children
  }

  if (user) {
    return (
      <PageShell maxWidth={1240}>
        <Panel sx={{ p: 4, textAlign: 'center' }} tone="warning">
          <Typography component="h1" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Bạn không có quyền truy cập</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Khu vực này chỉ dành cho quản trị viên TechForum.</Typography>
        </Panel>
      </PageShell>
    )
  }

  if (!isDialogOpen) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="route-status">
      <p>Nội dung này dành cho thành viên TechForum.</p>
      <AuthRequiredDialog
        isOpen
        onClose={() => {
          setIsDialogOpen(false)
          navigate('/', { replace: true })
        }}
      />
    </div>
  )
}
