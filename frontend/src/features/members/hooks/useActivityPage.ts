import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useMyActivity } from './activity'

const PAGE_SIZE = 20

// The page "my activity": what the member did lately, page by page.
export const useActivityPage = () => {
  const list = useListParams()
  const activityQuery = useMyActivity(list.page, PAGE_SIZE)

  return {
    data: activityQuery.data ?? null,
    isLoading: isInitialLoading(activityQuery),
    error: getErrorMessage(activityQuery.error, 'Không thể tải lịch sử hoạt động.'),
    reload: () => void activityQuery.refetch(),
    changePage: list.changePage,
  }
}
