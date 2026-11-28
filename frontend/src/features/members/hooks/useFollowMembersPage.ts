import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useFollowMembers, usePublicProfile } from './profiles'

// The people who follow a member, or the people a member follows, page by page.
export const useFollowMembersPage = (kind: 'followers' | 'following') => {
  const { userId = '' } = useParams()
  const list = useListParams()
  const membersQuery = useFollowMembers(userId, kind, list.page)
  // Tên thành viên cho đường dẫn trang; thường đã có sẵn trong bộ nhớ đệm khi đi từ trang hồ sơ sang.
  const profileQuery = usePublicProfile(userId, userId !== '')
  const requestError = membersQuery.error

  return {
    userId,
    title: kind === 'followers' ? 'Người theo dõi' : 'Đang theo dõi',
    memberName: profileQuery.data?.displayName ?? 'Hồ sơ',
    data: membersQuery.data ?? null,
    isLoading: isInitialLoading(membersQuery),
    notFoundTitle: requestError instanceof ApiError && requestError.status === 404 ? 'Không tìm thấy thành viên' : null,
    error: requestError instanceof ApiError && requestError.status === 404
      ? 'Không tìm thấy hồ sơ thành viên này.'
      : getErrorMessage(requestError, 'Không thể tải danh sách theo dõi.'),
    retry: () => void membersQuery.refetch(),
    changePage: list.changePage,
  }
}
