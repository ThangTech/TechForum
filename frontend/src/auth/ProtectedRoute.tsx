import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthRequiredDialog } from '../components/AuthRequiredDialog'
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
      <main className="main-area" id="main-content">
        <div className="page-content py-14">
          <div className="rounded-xl border border-amber-200 bg-white p-8 text-center">
            <h1 className="text-xl font-extrabold text-slate-950">Bạn không có quyền truy cập</h1>
            <p className="mt-2 text-sm text-slate-600">Khu vực này chỉ dành cho quản trị viên TechForum.</p>
          </div>
        </div>
      </main>
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
