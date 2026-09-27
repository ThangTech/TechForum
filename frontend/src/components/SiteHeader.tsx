export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-bar">
        <a className="brand" href="#main-content" aria-label="TechForum - về nội dung chính">
          Tech<span>Forum</span>
        </a>

        <div className="search-unavailable" aria-label="Tìm kiếm chưa khả dụng">
          <span className="search-unavailable__icon" aria-hidden="true" />
          <span>Tìm kiếm sẽ được mở khi chức năng sẵn sàng</span>
        </div>

        <div className="account-state" aria-label="Trạng thái tài khoản: khách">
          <span className="account-state__avatar" aria-hidden="true">K</span>
          <span>Khách</span>
        </div>
      </div>

      <nav className="category-nav" aria-label="Điều hướng chính">
        <a href="#categories">Chuyên mục</a>
        <a href="#topics-coming-soon">Chủ đề</a>
      </nav>
    </header>
  )
}
