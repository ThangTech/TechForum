import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { followMember, getPublicProfile, unfollowMember, type PublicProfile } from '../api/profiles'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicSummaryItem } from '../components/topics/TopicSummaryItem'
import { Button } from '@astryxdesign/core/Button'
import { useAuth } from '../auth/authState'
import { AuthRequiredDialog } from '../components/AuthRequiredDialog'
import { appRoutes } from '../appRoutes'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
}).format(new Date(value))

export const PublicProfilePage = () => {
  const { userId = '' } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const { user } = useAuth()
  const [isFollowBusy, setIsFollowBusy] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadProfile = async () => {
      if (!userId) {
        setError('Đường dẫn hồ sơ không hợp lệ.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        setProfile(await getPublicProfile(userId, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        if (requestError instanceof ApiError && requestError.status === 404) {
          setError('Không tìm thấy hồ sơ thành viên này.')
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [userId, requestVersion])

  const toggleFollow = async () => {
    if (!profile || isFollowBusy) return
    if (!user) { setIsAuthOpen(true); return }
    setIsFollowBusy(true); setActionError(null)
    try {
      const status = profile.isFollowedByViewer ? await unfollowMember(profile.id) : await followMember(profile.id)
      setProfile({ ...profile, isFollowedByViewer: status.isFollowing, followerCount: status.followerCount })
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật theo dõi.')
    } finally { setIsFollowBusy(false) }
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
          ← Về trang chủ
        </Link>

        <div className="mt-6">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải hồ sơ…"
            onRetry={() => setRequestVersion((version) => version + 1)}
          />
        </div>

        {!isLoading && !error && profile && (
          <div className="mt-6 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="profile-title">
              <div className="flex items-center gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-blue-100 text-2xl font-extrabold text-blue-700" aria-hidden="true">
                  {profile.displayName.slice(0, 1).toLocaleUpperCase('vi-VN')}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Hồ sơ công khai</p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" id="profile-title">
                    {profile.displayName}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">Tham gia từ {formatDate(profile.joinedAtUtc)}</p>
                </div>
                {user?.id !== profile.id && <div className="ml-auto"><Button isLoading={isFollowBusy} label={profile.isFollowedByViewer ? 'Đang theo dõi' : 'Theo dõi'} onClick={() => void toggleFollow()} variant={profile.isFollowedByViewer ? 'secondary' : 'primary'} /></div>}
              </div>
              {actionError && <p className="mt-4 text-sm text-red-700" role="alert">{actionError}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{profile.publishedTopicCount}</strong> nội dung</div><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{profile.followerCount}</strong> người theo dõi</div><div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{profile.receivedStarCount}</strong> Sao hữu ích</div></div>
              {profile.badges.length > 0 && <div className="mt-6"><h2 className="text-base font-bold text-slate-950">Danh hiệu</h2><div className="mt-3 flex flex-wrap gap-2">{profile.badges.map((badge) => <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800" key={badge.code} title={badge.description}>{badge.name}</span>)}</div></div>}
              {profile.skills.length > 0 && <div className="mt-6"><h2 className="text-base font-bold text-slate-950">Kỹ năng</h2><div className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <Link className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100" key={skill.tagId} to={appRoutes.skill(skill.tagId)}>#{skill.name} · {skill.topicCount}</Link>)}</div></div>}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="recent-topics-title">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-slate-950" id="recent-topics-title">Nội dung gần đây</h2>
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
