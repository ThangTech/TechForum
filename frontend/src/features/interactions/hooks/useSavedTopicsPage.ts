import { useListParams } from '../../../shared/hooks/useListParams'
import { useSavedTopics } from './bookmarks'

const PAGE_SIZE = 10

// The page "saved content", page by page.
export const useSavedTopicsPage = () => {
  const list = useListParams()
  return { page: list.page, savedQuery: useSavedTopics(list.page, PAGE_SIZE), changePage: list.changePage }
}
