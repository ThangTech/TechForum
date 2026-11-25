import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useAuth } from '../../auth/hooks/authState'
import { openAuthDialog } from '../../auth/store/authDialogStore'
import { usePublicProfile, useToggleFollow } from './profiles'

// The public profile of a member: the profile itself, and following or unfollowing them (a guest is asked to log in).
export const usePublicProfilePage = () => {
  const { userId = '' } = useParams()
  const isValidId = userId !== ''
  const { user } = useAuth()
  const profileQuery = usePublicProfile(userId, isValidId)
  const followMutation = useToggleFollow(userId)
  const [followError, setFollowError] = useState<string | null>(null)
  const profile = profileQuery.data ?? null

  const requestError = profileQuery.error
  const isNotFound = !isValidId || (requestError instanceof ApiError && requestError.status === 404)
  const loadError = requestError instanceof ApiError && requestError.status === 404
    ? 'Tài khoản có thể đã bị xóa hoặc đường dẫn không đúng.'
    : getErrorMessage(requestError)

  const toggleFollow = async () => {
    if (!profile || followMutation.isPending) return
    if (!user) {
      openAuthDialog()
      return
    }
    setFollowError(null)
    try {
      await followMutation.mutateAsync(profile.isFollowedByViewer)
    } catch (error) {
      setFollowError(error instanceof Error ? error.message : 'Không thể cập nhật theo dõi.')
    }
  }

  return {
    profile,
    isOwnProfile: Boolean(profile && user?.id === profile.id),
    isLoading: isValidId && isInitialLoading(profileQuery),
    error: isValidId ? loadError : 'Đường dẫn hồ sơ không hợp lệ.',
    notFoundTitle: isNotFound ? 'Không tìm thấy thành viên' : null,
    retry: () => void profileQuery.refetch(),
    follow: { toggle: toggleFollow, isBusy: followMutation.isPending, error: followError },
  }
}
