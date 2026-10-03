import { DropdownMenu, type DropdownMenuOption } from '@astryxdesign/core/DropdownMenu'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { appRoutes } from '../../appRoutes'

export const AccountMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setError(null)
    try {
      await logout()
      navigate(appRoutes.home, { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể đăng xuất lúc này.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const items: DropdownMenuOption[] = [
    { id: 'account', label: 'Trang tài khoản', onClick: () => navigate(appRoutes.account) },
    { id: 'content', label: 'Nội dung của tôi', onClick: () => navigate(appRoutes.myTopics) },
    { id: 'saved', label: 'Nội dung đã lưu', onClick: () => navigate(appRoutes.saved) },
    { id: 'write', label: 'Viết nội dung', onClick: () => navigate(appRoutes.write) },
    ...(user.roles.includes('Administrator')
      ? [
          { id: 'admin-overview', label: 'Tổng quan quản trị', onClick: () => navigate(appRoutes.adminOverview) },
          { id: 'admin-reports', label: 'Quản trị báo cáo', onClick: () => navigate(appRoutes.adminReports) },
          { id: 'admin-categories', label: 'Quản trị chuyên mục', onClick: () => navigate(appRoutes.adminCategories) },
          { id: 'admin-tags', label: 'Quản trị thẻ', onClick: () => navigate(appRoutes.adminTags) },
          { id: 'admin-accounts', label: 'Quản trị tài khoản', onClick: () => navigate(appRoutes.adminAccounts) },
          { id: 'admin-topics', label: 'Kiểm duyệt nội dung', onClick: () => navigate(appRoutes.adminTopics) },
        ]
      : []),
    { type: 'divider' },
    {
      id: 'logout',
      label: isLoggingOut ? 'Đang đăng xuất…' : 'Đăng xuất',
      isDisabled: isLoggingOut,
      onClick: () => void handleLogout(),
      variant: 'destructive',
    },
  ]

  return (
    <div className="grid justify-items-end gap-1">
      <DropdownMenu
        alignment="end"
        button={{ label: `${user.displayName.slice(0, 1).toLocaleUpperCase('vi-VN')} · ${user.displayName}` }}
        items={items}
        menuWidth={220}
        placement="below"
      />
      {error && <span className="max-w-56 text-right text-xs text-red-700" role="alert">{error}</span>}
    </div>
  )
}
