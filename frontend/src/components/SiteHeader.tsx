import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authState'

export const SiteHeader = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    navigate({ pathname: '/', search: params.toString() })
  }

  return (
    <header className="site-header">
      <div className="header-bar">
        <NavLink className="brand" to="/" aria-label="TechForum - trang chủ">
          Tech<span>Forum</span>
        </NavLink>

        <form className="search-unavailable" onSubmit={handleSearch} role="search">
          <span className="search-unavailable__icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="header-search">Tìm bài viết và câu hỏi</label>
          <input
            id="header-search"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm bài viết và câu hỏi"
            value={keyword}
          />
        </form>

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
        <NavLink to="/" end>Trang chủ</NavLink>
        <NavLink to="/bai-viet">Bài viết</NavLink>
        <NavLink to="/hoi-dap">Hỏi đáp</NavLink>
        <NavLink to="/tai-khoan">Tài khoản</NavLink>
      </nav>
    </header>
  )
}
