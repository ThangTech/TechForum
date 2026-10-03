import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getTopic, type TopicDetail } from '../api/topics'
import { toDisplayMediaHtml } from '../api/media'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/topics/TopicTypeBadge'
import { appRoutes } from '../appRoutes'
import { DiscussionSection } from '../components/discussions/DiscussionSection'
import { UsefulStarButton } from '../components/interactions/UsefulStarButton'

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date(value))

export const TopicDetailPage = () => {
  const { id } = useParams()
  const topicId = Number(id)
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadTopic = async () => {
      if (!Number.isInteger(topicId) || topicId <= 0) {
        setError('Đường dẫn nội dung không hợp lệ.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        setTopic(await getTopic(topicId, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        if (requestError instanceof ApiError && requestError.status === 404) {
          setError('Nội dung không tồn tại hoặc không còn được công khai.')
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadTopic()
    return () => controller.abort()
  }, [topicId, requestVersion])

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(820px,calc(100%-40px))] py-10 sm:py-14">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
          ← Quay lại danh sách
        </Link>

        <div className="mt-6">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            onRetry={() => setRequestVersion((version) => version + 1)}
          />
        </div>

        {!isLoading && !error && topic && (
          <article className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <header className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <TopicTypeBadge type={topic.type} />
                {topic.isPinned && <span className="font-semibold text-blue-700">Đã ghim</span>}
                {topic.isDiscussionLocked && <span className="font-semibold text-slate-500">Đã khóa thảo luận</span>}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {topic.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">{topic.summary}</p>
              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-slate-500">
                <Link className="font-semibold text-slate-700 hover:text-blue-700" to={appRoutes.member(topic.author.id)}>
                  {topic.author.displayName}
                </Link>
                <span aria-hidden="true">·</span>
                <span>{formatDateTime(topic.publishedAtUtc)}</span>
                <span aria-hidden="true">·</span>
                <span>{topic.category.name}</span>
              </div>
              {topic.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topic.tags.map((tag) => (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" key={tag.id}>
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div
              className="p-6 text-base leading-8 text-slate-800 sm:p-8 [&_a]:text-blue-700 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-5 [&_pre]:mb-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: toDisplayMediaHtml(topic.bodyHtml) }}
            />
            <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <UsefulStarButton topicId={topic.id} />
            </footer>
          </article>
        )}

        {!isLoading && !error && topic && (
          <DiscussionSection
            isLocked={topic.isDiscussionLocked}
            key={topic.id}
            topicAuthorId={topic.author.id}
            topicId={topic.id}
            topicType={topic.type}
          />
        )}
      </div>
    </main>
  )
}
