import { useQuery } from '@tanstack/react-query'
import { getMyActivity } from '../api/activity'
import { useUserScope, userKey } from './userScope'

export const activityKeys = {
  page: (scope: string, page: number, pageSize: number) =>
    userKey(scope, 'activity', { page, pageSize }),
}

export const useMyActivity = (page: number, pageSize: number) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: activityKeys.page(scope, page, pageSize),
    queryFn: ({ signal }) => getMyActivity(page, pageSize, signal),
    enabled: isReady && isSignedIn,
  })
}
