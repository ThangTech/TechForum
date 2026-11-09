import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicSummaryItem } from '../components/topics/TopicSummaryItem'
import { UserAvatar } from '../components/account/UserAvatar'
import { BackLink } from '../components/common/BackLink'
import { PageShell } from '../components/common/PageShell'
import { Panel } from '../components/common/Panel'
import { PanelList } from '../components/common/PanelList'
import { EmptyStateIcon } from '../components/common/EmptyStateIcon'
import { InlineStats } from '../components/common/InlineStats'
import { useAuth } from '../auth/authState'
import { openAuthDialog } from '../auth/authDialogStore'
import { appRoutes } from '../appRoutes'
import { getErrorMessage } from '../queries/errorMessage'
import { usePublicProfile, useToggleFollow } from '../queries/profiles'
import { isInitialLoading } from '../queries/status'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
}).format(new Date(value))

const sectionTitleSx = { color: 'var(--color-heading)', fontSize: '1rem', fontWeight: 700 } as const

export const PublicProfilePage = () => {
  const { userId = '' } = useParams()
  const isValidId = userId !== ''
  const profileQuery = usePublicProfile(userId, isValidId)
  const followMutation = useToggleFollow(userId)
  const profile = profileQuery.data ?? null
  const isLoading = isValidId && isInitialLoading(profileQuery)
  const requestError = profileQuery.error
  const loadError = requestError instanceof ApiError && requestError.status === 404
    ? 'Không tìm thấy hồ sơ thành viên này.'
    : getErrorMessage(requestError)
  const error = isValidId ? loadError : 'Đường dẫn hồ sơ không hợp lệ.'
  const { user } = useAuth()
  const isFollowBusy = followMutation.isPending
  const [actionError, setActionError] = useState<string | null>(null)
  const isOwnProfile = Boolean(profile && user?.id === profile.id)

  const toggleFollow = async () => {
    if (!profile || isFollowBusy) return
    if (!user) { openAuthDialog(); return }
    setActionError(null)
    try {
      await followMutation.mutateAsync(profile.isFollowedByViewer)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật theo dõi.')
    }
  }

  return (
    <PageShell>
      <BackLink to="/">← Về danh sách bài viết</BackLink>

      <Box sx={{ mt: 3 }}>
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải hồ sơ…"
          onRetry={() => void profileQuery.refetch()}
        />
      </Box>

      {!isLoading && !error && profile && (
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Panel aria-labelledby="profile-title" component="section" sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <UserAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} size="lg" />
              <Box sx={{ minWidth: 0, flex: '1 1 176px' }}>
                <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {isOwnProfile ? 'Trang cá nhân của bạn' : 'Hồ sơ công khai'}
                </Typography>
                <Typography
                  component="h1"
                  id="profile-title"
                  sx={{ mt: 0.5, color: 'var(--color-heading)', fontSize: { xs: '1.5rem', sm: '1.875rem' }, fontWeight: 800, letterSpacing: '-0.025em', overflowWrap: 'break-word' }}
                >
                  {profile.displayName}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Tham gia từ {formatDate(profile.joinedAtUtc)}</Typography>
              </Box>
              {isOwnProfile ? (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
                  <Button component={Link} to={appRoutes.account} variant="outlined">Chỉnh sửa hồ sơ</Button>
                  <Button component={Link} to={appRoutes.myTopics} variant="contained">Nội dung của tôi</Button>
                </Stack>
              ) : (
                <Box sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
                  <Button loading={isFollowBusy} onClick={() => void toggleFollow()} variant={profile.isFollowedByViewer ? 'outlined' : 'contained'}>
                    {profile.isFollowedByViewer ? 'Đang theo dõi' : 'Theo dõi'}
                  </Button>
                </Box>
              )}
            </Stack>
            {profile.bio && (
              <Typography sx={{ mt: 2.5, maxWidth: 672, color: 'text.primary', lineHeight: '1.5rem', whiteSpace: 'pre-line' }} variant="body2">{profile.bio}</Typography>
            )}
            {actionError && <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{actionError}</Typography>}
            <InlineStats
              items={[
                { value: profile.publishedTopicCount, label: 'nội dung' },
                { value: profile.followerCount, label: 'người theo dõi', to: appRoutes.followers(profile.id) },
                { value: profile.followingCount, label: 'đang theo dõi', to: appRoutes.following(profile.id) },
                { value: profile.receivedStarCount, label: 'Sao hữu ích' },
              ]}
              label="Thống kê hồ sơ"
              sx={{ mt: 2.5 }}
            />
            {profile.badges.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography component="h2" sx={sectionTitleSx}>Danh hiệu</Typography>
                <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  {profile.badges.map((badge) => (
                    <Chip
                      key={badge.code}
                      label={badge.name}
                      sx={{ bgcolor: 'var(--color-question-soft)', color: 'var(--color-question)', borderColor: 'var(--color-question-border)', fontWeight: 700 }}
                      title={badge.description}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {profile.skills.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography component="h2" sx={sectionTitleSx}>Kỹ năng</Typography>
                <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  {profile.skills.map((skill) => (
                    <Chip
                      clickable
                      color="primary"
                      component={Link}
                      key={skill.tagId}
                      label={skill.topicCount > 0 ? `#${skill.name} · ${skill.topicCount}` : `#${skill.name}`}
                      sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 700 }}
                      to={appRoutes.skill(skill.tagId)}
                      variant="filled"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Panel>

          <Panel aria-labelledby="recent-topics-title" component="section">
            <Box sx={{ p: { xs: 2.5, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
              <Typography component="h2" id="recent-topics-title" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Nội dung gần đây</Typography>
              {isOwnProfile && (
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  Đây là nội dung công khai của bạn. Xem bản nháp và quản lý bài đăng tại{' '}
                  <MuiLink component={Link} sx={{ fontWeight: 600 }} to={appRoutes.myTopics} underline="hover">Nội dung của tôi</MuiLink>.
                </Typography>
              )}
            </Box>
            {profile.recentTopics.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <EmptyStateIcon />
                <Typography color="text.secondary" variant="body2">
                  {isOwnProfile ? 'Bạn chưa có nội dung công khai. Hãy viết bài đầu tiên của bạn.' : 'Thành viên chưa có nội dung công khai.'}
                </Typography>
                {isOwnProfile && <Button component={Link} sx={{ mt: 2 }} to={appRoutes.write} variant="contained">Viết bài</Button>}
              </Box>
            ) : (
              <PanelList>
                {profile.recentTopics.map((topic) => (
                  <Box component="li" key={topic.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <TopicSummaryItem showAuthor={false} topic={topic} />
                  </Box>
                ))}
              </PanelList>
            )}
          </Panel>
        </Stack>
      )}
    </PageShell>
  )
}
