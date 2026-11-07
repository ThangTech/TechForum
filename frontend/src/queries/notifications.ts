import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationRead } from '../api/notifications'
import { useUserScope, userKey } from './userScope'

export const notificationKeys = {
  // Every notification list of one user. The unread count in the header is the first page
  // with one item, so it is part of the same group and changes with it.
  all: (scope: string) => userKey(scope, 'notifications'),
  page: (scope: string, page: number, pageSize: number) =>
    [...notificationKeys.all(scope), { page, pageSize }] as const,
}

export const useNotifications = (page: number, pageSize: number) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: notificationKeys.page(scope, page, pageSize),
    queryFn: ({ signal }) => getNotifications(page, pageSize, signal),
    enabled: isReady && isSignedIn,
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(notificationId),
    // The list and the unread count in the header load again.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all(scope) }),
  })
}
