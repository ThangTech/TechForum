import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { useNotifications } from '../../queries/notifications'

export const NotificationLink = () => {
  // The unread count comes with the first page of notifications. Marking a notification as read
  // loads it again, so the number changes without any extra code. If it cannot be loaded, it shows 0.
  const { data } = useNotifications(1, 1)
  const unreadCount = data?.unreadCount ?? 0

  return (
    <IconButton
      aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      component={NavLink}
      sx={{ color: 'text.primary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
      to={appRoutes.notifications}
    >
      {/* The number is already in the aria-label of the link, so the badge is hidden from screen readers. */}
      <Badge badgeContent={unreadCount} color="error" max={99} slotProps={{ badge: { 'aria-hidden': true } }}>
        <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M10 21h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      </Badge>
    </IconButton>
  )
}
