import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getPublicProfile, type PublicProfile } from '../api/profiles'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
}).format(new Date(value))

export const PublicProfilePage = () => {
  const { userId = '' } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

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

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
          ← Về trang chủ
        </Link>

        {isLoading && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">
            Đang tải hồ sơ…
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-6 space-y-4 rounded-xl border border-red-200 bg-white p-10 text-center" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button label="Thử lại" onClick={() => setRequestVersion((version) => version + 1)} variant="secondary" />
          </div>
        )}

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
              </div>
              <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <strong className="text-slate-950">{profile.publishedTopicCount}</strong> nội dung đang được công khai
              </div>
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
                      <span className={topic.type === 'question'
                        ? 'text-xs font-bold text-amber-700'
                        : 'text-xs font-bold text-blue-700'}>
                        {topic.type === 'question' ? 'Câu hỏi' : 'Bài viết'}
                      </span>
                      <Link className="mt-2 block text-lg font-bold text-slate-950 hover:text-blue-700" to={`/noi-dung/${topic.id}`}>
                        {topic.title}
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p>
                      <p className="mt-3 text-xs text-slate-500">{formatDate(topic.publishedAtUtc)} · {topic.category.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
