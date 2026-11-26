import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useCommunities } from './skills'

// Trang Cộng đồng: mỗi thẻ là một cộng đồng, sôi nổi nhất (nhiều bài nhất) đứng trước.
export const useCommunitiesPage = () => {
  const communitiesQuery = useCommunities()

  return {
    communities: communitiesQuery.data ?? [],
    isLoading: isInitialLoading(communitiesQuery),
    error: getErrorMessage(communitiesQuery.error),
    retry: () => void communitiesQuery.refetch(),
  }
}
