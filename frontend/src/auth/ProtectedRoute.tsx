import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthRequiredDialog } from '../components/AuthRequiredDialog'
import { useAuth } from './authState'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(true)

  if (isLoading) {
    return <div className="route-status" role="status">Đang kiểm tra phiên đăng nhập…</div>
  }

  if (user) {
    return children
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
