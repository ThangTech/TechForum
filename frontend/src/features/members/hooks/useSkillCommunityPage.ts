import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { isGuid } from '../../../shared/utils/ids'
import { useSkillCommunity } from './skills'

// The community of one skill (tag): the skill and the members who chose it, page by page.
export const useSkillCommunityPage = () => {
  const { tagId = '' } = useParams()
  const id = tagId.toLowerCase()
  const isValidId = isGuid(id)
  const list = useListParams()
  const communityQuery = useSkillCommunity(id, list.page, isValidId)
  const requestError = communityQuery.error
  const error = requestError instanceof ApiError && requestError.status === 404
    ? 'Kỹ năng này không tồn tại hoặc đã ngừng sử dụng.'
    : getErrorMessage(requestError, 'Không thể tải kỹ năng.')

  return {
    isValidId,
    data: communityQuery.data ?? null,
    visibleError: isValidId ? error : 'Đường dẫn kỹ năng không hợp lệ.',
    visibleLoading: isValidId && isInitialLoading(communityQuery),
    retry: () => void communityQuery.refetch(),
    changePage: list.changePage,
  }
}
