import { Link, Outlet, useLocation } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { useAuth } from '../auth/authState'
import { AdminNavigation } from './admin/AdminNavigation'
import { SiteHeader } from './SiteHeader'

export const SiteLayout = () => {
  const { user, isLoading } = useAuth()
  const { pathname } = useLocation()
  const isAdminRoute = pathname === appRoutes.adminOverview || pathname.startsWith(`${appRoutes.adminOverview}/`)
  const showAdminNavigation = !isLoading && user?.roles.includes('Administrator') && isAdminRoute

  return (
    <div className="site-shell">
      <SiteHeader />
      {showAdminNavigation && <AdminNavigation />}
      <Outlet />
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>TechForum · Nơi kiến thức được sẻ chia</span>
          <nav aria-label="Liên kết cuối trang" className="flex gap-4">
            <Link to={appRoutes.articles}>Bài viết</Link>
            <Link to={appRoutes.questions}>Hỏi đáp</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
