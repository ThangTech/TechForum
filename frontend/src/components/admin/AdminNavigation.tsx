import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'

const adminLinks = [
  { to: appRoutes.adminOverview, label: 'Tổng quan' },
  { to: appRoutes.adminTopics, label: 'Nội dung' },
  { to: appRoutes.adminReports, label: 'Báo cáo' },
  { to: appRoutes.adminCategories, label: 'Chuyên mục' },
  { to: appRoutes.adminTags, label: 'Thẻ' },
  { to: appRoutes.adminAccounts, label: 'Tài khoản' },
]

export const AdminNavigation = () => {
  return (
    <div className="border-b border-slate-200 bg-white">
      <nav aria-label="Điều hướng quản trị" className="page-content flex flex-wrap gap-x-1 gap-y-1 py-2">
        {adminLinks.map((link) => (
          <NavLink
            className={({ isActive }) => `border-b-2 px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
              isActive
                ? 'border-blue-700 bg-blue-50 text-blue-800'
                : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
            }`}
            end={link.to === appRoutes.adminOverview}
            key={link.to}
            to={link.to}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
