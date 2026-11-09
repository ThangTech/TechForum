import { Outlet } from 'react-router-dom'
import { SiteFooter } from './footer/SiteFooter'
import { SiteHeader } from './SiteHeader'

export const SiteLayout = () => {
  return (
    <div className="site-shell">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  )
}
