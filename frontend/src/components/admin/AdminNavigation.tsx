import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { adminLinks } from './adminNavigationLinks'

export const AdminNavigation = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <nav aria-label="Điều hướng quản trị" className="admin-navigation">
      {adminLinks.map((link) => (
        <NavLink
          className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
          end={link.to === appRoutes.adminOverview}
          key={link.to}
          onClick={onNavigate}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
