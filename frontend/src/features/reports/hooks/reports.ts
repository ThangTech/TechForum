import { useQuery } from '@tanstack/react-query'
import { getMyReports } from '../api/reports'
import type { ReportStatus } from '../types/reports'
import { useUserScope, userKey } from '../../auth/hooks/userScope'

export const reportKeys = {
  mine: (scope: string, status: ReportStatus | '', page: number, pageSize: number) =>
    userKey(scope, 'reports', 'mine', { status, page, pageSize }),
}

export const useMyReports = (status: ReportStatus | '', page: number, pageSize: number) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: reportKeys.mine(scope, status, page, pageSize),
    queryFn: ({ signal }) => getMyReports(status, page, pageSize, signal),
    enabled: isReady && isSignedIn,
  })
}
