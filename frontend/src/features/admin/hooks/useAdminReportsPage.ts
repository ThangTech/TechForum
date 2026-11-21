import { useState } from 'react'
import { ApiError } from '../../../shared/api/client'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import type { AdminReport, ReportStatus } from '../../reports/types/reports'
import { useAdminReports, useResolveReport } from './reportQueries'

const PAGE_SIZE = 10

export type ReportDecision = 'accepted' | 'rejected'

// The status in the address; anything else shows the reports that wait for a decision.
const readStatus = (value: string | null): ReportStatus =>
  value === 'accepted' || value === 'rejected' ? value : 'pending'

// Everything the admin page of reports does: the list by status, the preview of the reported content, and the
// decision (accept or reject) with a note.
export const useAdminReportsPage = () => {
  const list = useListParams()
  const status = readStatus(list.params.get('status'))
  const feedback = useActionFeedback()
  const [selected, setSelected] = useState<{ report: AdminReport; decision: ReportDecision } | null>(null)
  const [preview, setPreview] = useState<AdminReport | null>(null)

  const reportsQuery = useAdminReports(status, list.page, PAGE_SIZE)
  const resolveMutation = useResolveReport()

  // "pending" and page 1 are the defaults, so they are not written in the address.
  const showStatus = (nextStatus: ReportStatus, nextPage = 1) => {
    const next = new URLSearchParams()
    if (nextStatus !== 'pending') next.set('status', nextStatus)
    if (nextPage > 1) next.set('page', String(nextPage))
    list.apply(next)
  }

  const choose = (report: AdminReport, decision: ReportDecision) => {
    feedback.clear()
    setSelected({ report, decision })
  }

  const chooseFromPreview = (report: AdminReport, decision: ReportDecision) => {
    setPreview(null)
    feedback.setError(null)
    setSelected({ report, decision })
  }

  const closeDecision = () => {
    feedback.setError(null)
    setSelected(null)
  }

  const resolve = async (note: string) => {
    if (!selected || resolveMutation.isPending) return
    // The list loads again after the decision.
    const done = await feedback.run(
      () => resolveMutation.mutateAsync({ reportId: selected.report.id, decision: selected.decision, note }),
      {
        success: selected.decision === 'accepted' ? 'Đã chấp nhận báo cáo.' : 'Đã bác bỏ báo cáo.',
        failure: 'Không thể xử lý báo cáo.',
        // 409: another administrator already decided this report, so show the current list.
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setSelected(null)
            void reportsQuery.refetch()
          }
        },
      },
    )
    if (done) setSelected(null)
  }

  return {
    status,
    showStatus,
    data: reportsQuery.data ?? null,
    isLoading: isInitialLoading(reportsQuery),
    error: getErrorMessage(reportsQuery.error, 'Không thể tải danh sách báo cáo.'),
    retry: () => void reportsQuery.refetch(),
    feedback: { error: feedback.error, success: feedback.success },
    preview: { report: preview, open: setPreview, close: () => setPreview(null), choose: chooseFromPreview },
    decision: {
      selected,
      isBusy: resolveMutation.isPending,
      error: feedback.error,
      choose,
      close: closeDecision,
      confirm: resolve,
    },
  }
}
