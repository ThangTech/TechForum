import { lazy, Suspense } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authState'
import { appRoutes } from '../appRoutes'
import { NotificationLink } from './notifications/NotificationLink'
import { createAuthUrl } from '../auth/returnUrl'
import { HeaderSearch } from './header/HeaderSearch'
import { ThemeModeToggle } from './header/ThemeModeToggle'

const AccountMenu = lazy(() => import('./account/AccountMenu').then((module) => ({
  default: module.AccountMenu,
})))
const WriteMenu = lazy(() => import('./header/WriteMenu').then((module) => ({
  default: module.WriteMenu,
})))

export const SiteHeader = () => {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const returnUrl = `${location.pathname}${location.search}${location.hash}`
  const isArticlePage = location.pathname === '/' || location.pathname === appRoutes.articles

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      <div className="header-bar">
        <NavLink className="brand" to={appRoutes.home} aria-label="TechForum - danh sách bài viết">
          Tech<span>Forum</span>
        </NavLink>

        <nav className="primary-nav" aria-label="Điều hướng chính" data-tour="content-types">
          <Link to={appRoutes.articles} className={isArticlePage ? 'active' : undefined} aria-current={isArticlePage ? 'page' : undefined}>Bài viết</Link>
          <NavLink to={appRoutes.questions}>Hỏi đáp</NavLink>
          <NavLink to={appRoutes.discussions}>Thảo luận</NavLink>
          <NavLink to={appRoutes.communities}>Cộng đồng</NavLink>
        </nav>

        <HeaderSearch />

        <div className="account-actions" data-tour="account">
          <Suspense fallback={<span className="account-loading">…</span>}><WriteMenu /></Suspense>
          {isLoading ? (
            <span className="account-loading" role="status">Đang kiểm tra phiên…</span>
          ) : user ? (
            <>
              <NotificationLink />
              <Suspense fallback={<span className="account-loading">Đang tải tài khoản…</span>}>
                <AccountMenu />
              </Suspense>
            </>
          ) : (
            <>
              <NavLink className="header-link" to={createAuthUrl(appRoutes.login, returnUrl)}>Đăng nhập</NavLink>
              <NavLink className="header-register" to={createAuthUrl(appRoutes.register, returnUrl)}>Đăng ký</NavLink>
            </>
          )}
          <ThemeModeToggle />
        </div>
      </div>

    </header>
  )
}
