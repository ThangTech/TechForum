import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/authState'

export function SiteHeader() {
  const { user, isLoading } = useAuth()

  return (
    <header className="site-header">
      <div className="header-bar">
        <NavLink className="brand" to="/" aria-label="TechForum - trang chủ">
          Tech<span>Forum</span>
        </NavLink>

        <div className="search-unavailable" aria-label="Tìm kiếm chưa khả dụng">
          <span className="search-unavailable__icon" aria-hidden="true" />
          <span>Tìm kiếm sẽ được mở khi chức năng sẵn sàng</span>
        </div>

        <div className="account-actions">
          {isLoading ? (
            <span className="account-loading" role="status">Đang kiểm tra phiên…</span>
          ) : user ? (
            <NavLink className="account-state" to="/tai-khoan">
              <span className="account-state__avatar" aria-hidden="true">
                {user.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span>{user.displayName}</span>
            </NavLink>
          ) : (
            <>
              <NavLink className="header-link" to="/dang-nhap">Đăng nhập</NavLink>
              <NavLink className="header-register" to="/dang-ky">Đăng ký</NavLink>
            </>
          )}
        </div>
      </div>

      <nav className="category-nav" aria-label="Điều hướng chính">
        <NavLink to="/">Chuyên mục</NavLink>
        <NavLink to="/tai-khoan">Tài khoản</NavLink>
      </nav>
    </header>
  )
}
