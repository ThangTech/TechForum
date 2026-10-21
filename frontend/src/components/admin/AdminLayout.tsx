import { Button } from '@astryxdesign/core/Button'
import { useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { useAuth } from '../../auth/authState'
import { ApiError } from '../../api/client'
import { AdminNavigation } from './AdminNavigation'
import { adminLinks } from './adminNavigationLinks'
import '../../styles/admin.css'

export const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const currentPage = adminLinks.find((link) => link.to === location.pathname)?.label ?? 'Quản trị'

  const signOut = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setError(null)
    try {
      await logout()
      navigate(appRoutes.home)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể đăng xuất. Vui lòng thử lại.',
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div
      className={`admin-shell ${isMenuOpen ? 'admin-menu-open' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isMenuOpen) {
          setIsMenuOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <a className="skip-link" href="#main-content">
        Chuyển đến nội dung
      </a>
      <aside className="admin-sidebar" id="admin-sidebar" ref={sidebar}>
        <Link className="admin-brand" to={appRoutes.adminOverview} onClick={() => setIsMenuOpen(false)}>
          Tech<span>Forum</span>
          <small>QUẢN TRỊ DIỄN ĐÀN</small>
        </Link>
        <p className="admin-nav-label">Không gian quản lý</p>
        <AdminNavigation onNavigate={() => setIsMenuOpen(false)} />
        <div className="admin-sidebar-footer">
          <span className="admin-status-dot" /> Hệ thống quản trị
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            aria-controls="admin-sidebar"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
            className="admin-menu-button"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen)
              if (!isMenuOpen)
                requestAnimationFrame(() =>
                  sidebar.current?.querySelector<HTMLAnchorElement>('nav a')?.focus(),
                )
            }}
            ref={menuButton}
            type="button"
          >
            ☰
          </button>
          <nav aria-label="Đường dẫn trang" className="admin-breadcrumb">
            <Link to={appRoutes.adminOverview}>Quản trị</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{currentPage}</span>
          </nav>
          <div className="admin-topbar-actions">
            <Link className="admin-forum-link" to={appRoutes.home}>
              Về diễn đàn ↗
            </Link>
            <div className="admin-current-user">
              <strong>{user?.displayName}</strong>
              <span>Quản trị viên</span>
            </div>
            <Button
              isDisabled={isLoggingOut}
              isLoading={isLoggingOut}
              label="Đăng xuất"
              onClick={() => void signOut()}
              variant="ghost"
            />
          </div>
        </header>
        <main className="admin-main" id="main-content">
          {error && (
            <p className="admin-message admin-message-error" role="alert">
              {error}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
