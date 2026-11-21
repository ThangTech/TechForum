import { useListParams } from '../../../shared/hooks/useListParams'
import { useStarredTopics } from './stars'

const PAGE_SIZE = 10

// The page "posts I starred", page by page.
export const useStarredTopicsPage = () => {
  const list = useListParams()
  return { page: list.page, starredQuery: useStarredTopics(list.page, PAGE_SIZE), changePage: list.changePage }
}
