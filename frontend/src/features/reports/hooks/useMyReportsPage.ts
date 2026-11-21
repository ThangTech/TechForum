import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { readChoice } from '../../../shared/utils/searchParams'
import { useMyReports } from './reports'

const PAGE_SIZE = 10

// The page "my reports": the reports the member sent, filtered by status, page by page.
export const useMyReportsPage = () => {
  const list = useListParams()
  const status = readChoice(list.params.get('status'), ['pending', 'accepted', 'rejected'] as const)
  const reportsQuery = useMyReports(status, list.page, PAGE_SIZE)

  return {
    status,
    // A new status shows its first page.
    changeStatus: (value: string) => list.apply(new URLSearchParams(value ? { status: value } : {})),
    page: list.page,
    changePage: list.changePage,
    data: reportsQuery.data ?? null,
    isLoading: isInitialLoading(reportsQuery),
    error: getErrorMessage(reportsQuery.error, 'Không thể tải báo cáo.'),
    retry: () => void reportsQuery.refetch(),
  }
}
