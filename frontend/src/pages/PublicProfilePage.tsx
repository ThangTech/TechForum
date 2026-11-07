import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicSummaryItem } from '../components/topics/TopicSummaryItem'
import { UserAvatar } from '../components/account/UserAvatar'
import Button from '@mui/material/Button'
import { useAuth } from '../auth/authState'
import { AuthRequiredDialog } from '../components/AuthRequiredDialog'
import { appRoutes } from '../appRoutes'
import { getErrorMessage } from '../queries/errorMessage'
import { usePublicProfile, useToggleFollow } from '../queries/profiles'
import { isInitialLoading } from '../queries/status'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
}).format(new Date(value))

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
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const isOwnProfile = Boolean(profile && user?.id === profile.id)

  const toggleFollow = async () => {
    if (!profile || isFollowBusy) return
    if (!user) { setIsAuthOpen(true); return }
    setActionError(null)
    try {
      await followMutation.mutateAsync(profile.isFollowedByViewer)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật theo dõi.')
    }
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
          ← Về danh sách bài viết
        </Link>

        <div className="mt-6">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải hồ sơ…"
            onRetry={() => void profileQuery.refetch()}
          />
        </div>

        {!isLoading && !error && profile && (
          <div className="mt-6 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="profile-title">
              <div className="flex flex-wrap items-center gap-4">
                <UserAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} size="lg" />
                <div className="min-w-0 flex-1 basis-44">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-700">{isOwnProfile ? 'Trang cá nhân của bạn' : 'Hồ sơ công khai'}</p>
                  <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" id="profile-title">
                    {profile.displayName}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">Tham gia từ {formatDate(profile.joinedAtUtc)}</p>
                </div>
                {isOwnProfile ? (
                  <div className="flex w-full flex-wrap gap-3 sm:ml-auto sm:w-auto">
                    <Link className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" to={appRoutes.account}>Chỉnh sửa hồ sơ</Link>
                    <Link className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" to={appRoutes.myTopics}>Nội dung của tôi</Link>
                  </div>
                ) : (
                  <div className="w-full sm:ml-auto sm:w-auto"><Button loading={isFollowBusy} onClick={() => void toggleFollow()} variant={profile.isFollowedByViewer ? 'outlined' : 'contained'}>{profile.isFollowedByViewer ? 'Đang theo dõi' : 'Theo dõi'}</Button></div>
                )}
              </div>
              {profile.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-6 text-slate-700">{profile.bio}</p>}
              {actionError && <p className="mt-4 text-sm text-red-700" role="alert">{actionError}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-4"><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{profile.publishedTopicCount}</strong> nội dung</div><Link className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700" to={appRoutes.followers(profile.id)}><strong>{profile.followerCount}</strong> người theo dõi</Link><Link className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700" to={appRoutes.following(profile.id)}><strong>{profile.followingCount}</strong> đang theo dõi</Link><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{profile.receivedStarCount}</strong> Sao hữu ích</div></div>
              {profile.badges.length > 0 && <div className="mt-6"><h2 className="text-base font-bold text-slate-950">Danh hiệu</h2><div className="mt-3 flex flex-wrap gap-2">{profile.badges.map((badge) => <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800" key={badge.code} title={badge.description}>{badge.name}</span>)}</div></div>}
              {profile.skills.length > 0 && <div className="mt-6"><h2 className="text-base font-bold text-slate-950">Kỹ năng</h2><div className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <Link className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100" key={skill.tagId} to={appRoutes.skill(skill.tagId)}>#{skill.name} · {skill.topicCount}</Link>)}</div></div>}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="recent-topics-title">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-slate-950" id="recent-topics-title">Nội dung gần đây</h2>
                {isOwnProfile && <p className="mt-2 text-sm text-slate-600">Đây là nội dung công khai của bạn. Xem bản nháp và quản lý bài đăng tại <Link className="font-semibold text-blue-700 hover:underline" to={appRoutes.myTopics}>Nội dung của tôi</Link>.</p>}
              </div>
              {profile.recentTopics.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">Thành viên chưa có nội dung công khai.</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {profile.recentTopics.map((topic) => (
                    <li className="p-5 sm:p-6" key={topic.id}>
                      <TopicSummaryItem showAuthor={false} topic={topic} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
      <AuthRequiredDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  )
}
