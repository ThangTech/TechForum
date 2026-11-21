import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { safeNotificationLink } from '../utils/notificationLink'
import { useMarkNotificationRead, useNotifications } from './notifications'

const PAGE_SIZE = 10

// The notifications page: the list, and opening one notification (it is marked read first). A notification that
// leads to the notifications page itself is shown in a box above the list instead.
export const useNotificationsPage = () => {
  const navigate = useNavigate()
  const list = useListParams()
  const notificationsQuery = useNotifications(list.page, PAGE_SIZE)
  const markReadMutation = useMarkNotificationRead()
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const data = notificationsQuery.data ?? null

  const retry = () => {
    setActionError(null)
    void notificationsQuery.refetch()
  }

  const open = async (id: string, link: string, isRead: boolean) => {
    if (busyId !== null) return
    setBusyId(id)
    setActionError(null)
    try {
      // The list and the unread count in the header load again after this.
      if (!isRead) await markReadMutation.mutateAsync(id)
      const destination = safeNotificationLink(link)
      if (destination === '/notifications') setOpenedId(id)
      else navigate(destination)
    } catch (requestError) {
      setActionError(getActionError(requestError, 'Không thể mở thông báo.'))
    } finally {
      setBusyId(null)
    }
  }

  return {
    data,
    isLoading: isInitialLoading(notificationsQuery),
    error: actionError ?? getErrorMessage(notificationsQuery.error, 'Không thể tải thông báo.'),
    retry,
    changePage: list.changePage,
    busyId,
    open,
    opened: data?.items.find((item) => item.id === openedId) ?? null,
    closeOpened: () => setOpenedId(null),
  }
}
