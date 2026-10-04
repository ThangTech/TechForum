import { lazy, Suspense, useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authState'
import { appRoutes } from '../appRoutes'
import { NotificationLink } from './notifications/NotificationLink'

const AccountMenu = lazy(() => import('./account/AccountMenu').then((module) => ({
  default: module.AccountMenu,
})))
const WriteMenu = lazy(() => import('./header/WriteMenu').then((module) => ({
  default: module.WriteMenu,
})))

export const SiteHeader = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    navigate({ pathname: appRoutes.search, search: params.toString() })
  }

  return (
    <header className="site-header">
      <div className="header-bar">
        <NavLink className="brand" to={appRoutes.home} aria-label="TechForum - danh sách bài viết">
          Tech<span>Forum</span>
        </NavLink>

        <nav className="primary-nav" aria-label="Điều hướng chính" data-tour="content-types">
          <NavLink to={appRoutes.home} end>Bài viết</NavLink>
          <NavLink to={appRoutes.questions}>Hỏi đáp</NavLink>
          <NavLink to={appRoutes.discussions}>Thảo luận</NavLink>
        </nav>

        <form className="search-unavailable" data-tour="search" onSubmit={handleSearch} role="search">
          <span className="search-unavailable__icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="header-search">Tìm bài viết và câu hỏi</label>
          <input
            id="header-search"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm bài viết và câu hỏi"
            value={keyword}
          />
        </form>

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
              <NavLink className="header-link" to={appRoutes.login}>Đăng nhập</NavLink>
              <NavLink className="header-register" to={appRoutes.register}>Đăng ký</NavLink>
            </>
          )}
        </div>
      </div>

    </header>
  )
}
