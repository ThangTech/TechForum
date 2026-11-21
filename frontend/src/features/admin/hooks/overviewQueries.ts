import { useQuery } from '@tanstack/react-query'
import { getAdminAuditLogs, getAdminDashboard } from '../api/adminOverview'
import type { AuditFilters } from '../types/adminOverview'
import { adminKeys, useAdminQueryState } from './adminKeys'

// The data of the admin page "dashboard and audit log".
export const useAdminDashboard = (startDate: string, endDate: string) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.dashboard(scope, startDate, endDate),
    queryFn: ({ signal }) => getAdminDashboard(startDate, endDate, signal),
    enabled: isEnabled,
  })
}

export const useAdminAuditLogs = (filters: AuditFilters) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.audit(scope, filters),
    queryFn: ({ signal }) => getAdminAuditLogs(filters, signal),
    enabled: isEnabled,
  })
}
