import { Outlet } from 'react-router-dom'
import { EmailVerificationBanner } from '../../features/auth/components/EmailVerificationBanner'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export const SiteLayout = () => {
  return (
    <div className="site-shell">
      <SiteHeader />
      <EmailVerificationBanner />
      <Outlet />
      <SiteFooter />
    </div>
  )
}
