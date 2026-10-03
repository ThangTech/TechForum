import { useCallback, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getNotifications } from '../../api/notifications'
import { appRoutes } from '../../appRoutes'

export const notificationsChangedEvent = 'techforum:notifications-changed'

export const NotificationLink = () => {
  const [unreadCount, setUnreadCount] = useState(0)

  const loadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getNotifications(1, 1, signal)
      setUnreadCount(result.unreadCount)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => void loadCount(controller.signal), 0)
    const refresh = () => void loadCount()
    window.addEventListener(notificationsChangedEvent, refresh)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
      window.removeEventListener(notificationsChangedEvent, refresh)
    }
  }, [loadCount])

  return (
    <NavLink className="relative text-sm font-bold text-slate-700 hover:text-blue-700" to={appRoutes.notifications}>
      Thông báo
      {unreadCount > 0 && (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white" aria-label={`${unreadCount} thông báo chưa đọc`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </NavLink>
  )
}
