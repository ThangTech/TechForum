import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useTags } from '../../catalog/hooks/tags'

// The page of communities: one community for each tag.
export const useCommunitiesPage = () => {
  const tagsQuery = useTags()

  return {
    tags: tagsQuery.data ?? [],
    isLoading: isInitialLoading(tagsQuery),
    error: getErrorMessage(tagsQuery.error),
    retry: () => void tagsQuery.refetch(),
  }
}
