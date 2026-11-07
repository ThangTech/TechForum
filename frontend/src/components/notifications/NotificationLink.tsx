import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { useNotifications } from '../../queries/notifications'

export const NotificationLink = () => {
  // The unread count comes with the first page of notifications. Marking a notification as read
  // loads it again, so the number changes without any extra code. If it cannot be loaded, it shows 0.
  const { data } = useNotifications(1, 1)
  const unreadCount = data?.unreadCount ?? 0

  return (
    <NavLink
      aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      className="relative inline-flex size-9 shrink-0 items-center justify-center text-slate-700 hover:text-blue-700"
      to={appRoutes.notifications}
    >
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M10 21h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </NavLink>
  )
}
