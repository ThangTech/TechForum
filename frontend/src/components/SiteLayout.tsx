import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

export const SiteLayout = () => {
  return (
    <div className="site-shell">
      <SiteHeader />
      <Outlet />
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>TechForum · Nơi kiến thức được sẻ chia</span>
          <span>Đồ án diễn đàn công nghệ</span>
        </div>
      </footer>
    </div>
  )
}
