import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

export function SiteLayout() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <Outlet />
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>TechForum · Nơi kiến thức được sẻ chia</span>
          <span>P1 · Xác thực và nền giao diện</span>
        </div>
      </footer>
    </div>
  )
}
