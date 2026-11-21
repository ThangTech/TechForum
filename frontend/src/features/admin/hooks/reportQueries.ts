import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminReports, resolveReport } from '../../reports/api/reports'
import type { ReportStatus } from '../../reports/types/reports'
import { adminKeys, useInvalidateAdminData, useAdminQueryState } from './adminKeys'
import { topicKeys } from '../../topics/hooks/topics'

// The data of the admin page "reports".
export const useAdminReports = (status: ReportStatus, page: number, pageSize: number) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.reports(scope, status, page, pageSize),
    queryFn: ({ signal }) => getAdminReports(status, page, pageSize, signal),
    enabled: isEnabled,
  })
}

export const useResolveReport = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: { reportId: string; decision: 'accepted' | 'rejected'; note: string }) =>
      resolveReport(input.reportId, input.decision, input.note),
    onSuccess: () => {
      void invalidateAdminData()
      // An accepted report can hide a topic or an answer, so public data changes too.
      void queryClient.invalidateQueries({ queryKey: topicKeys.all })
    },
  })
}
