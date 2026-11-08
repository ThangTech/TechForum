import Stack from '@mui/material/Stack'
import { Link, Outlet } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { SiteHeader } from './SiteHeader'

export const SiteLayout = () => {
  return (
    <div className="site-shell">
      <SiteHeader />
      <Outlet />
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>TechForum · Nơi kiến thức được sẻ chia</span>
          <Stack aria-label="Liên kết cuối trang" component="nav" direction="row" sx={{ gap: 2 }}>
            <Link to={appRoutes.articles}>Bài viết</Link>
            <Link to={appRoutes.questions}>Hỏi đáp</Link>
          </Stack>
        </div>
      </footer>
    </div>
  )
}
