import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getTopic, type TopicDetail } from '../api/topics'
import { toDisplayMediaHtml } from '../api/media'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/topics/TopicTypeBadge'
import { appRoutes } from '../appRoutes'
import { DiscussionSection } from '../components/discussions/DiscussionSection'
import { UsefulStarButton } from '../components/interactions/UsefulStarButton'
import { BookmarkButton } from '../components/interactions/BookmarkButton'
import { ReportAction } from '../components/reports/ReportAction'
import { TopicEngagementBar } from '../components/interactions/TopicEngagementBar'
import { useAuth } from '../auth/authState'
import { ReadingTableOfContents } from '../components/topics/ReadingTableOfContents'
import { RelatedTopics } from '../components/topics/RelatedTopics'
import { prepareReadingContent } from '../utils/readingContent'
import '../styles/topicReading.css'

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date(value))

export const TopicDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const topicId = Number(id)
  const { user } = useAuth()
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const readingContent = useMemo(
    () => topic ? prepareReadingContent(toDisplayMediaHtml(topic.bodyHtml), topic.id) : null,
    [topic],
  )

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
        const loadedTopic = await getTopic(topicId, controller.signal)
        if (!controller.signal.aborted) setTopic(loadedTopic)
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

  useEffect(() => {
    if (isLoading || error || topic?.id !== topicId || !readingContent) return
    const headingId = location.hash.slice(1)
    if (!readingContent.headings.some((heading) => heading.id === headingId)) return

    const heading = document.getElementById(headingId)
    heading?.scrollIntoView({ block: 'start' })
    heading?.focus({ preventScroll: true })
  }, [error, isLoading, location.hash, readingContent, topic?.id, topicId])

  const isTopicReady = !isLoading && !error && topic?.id === topicId && readingContent !== null
  const wasUpdatedAfterPublication = topic?.updatedAtUtc &&
    new Date(topic.updatedAtUtc).getTime() > new Date(topic.publishedAtUtc).getTime()

  return (
    <main className="main-area" id="main-content">
      <div className={`topic-reading-page${readingContent?.headings.length ? '' : ' topic-reading-page--without-toc'}`}>
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to={topic?.type === 'question' ? appRoutes.questions : appRoutes.articles}>
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

        {isTopicReady && topic && readingContent && (
          <div className={`topic-reading-layout${readingContent.headings.length > 0 ? ' topic-reading-layout--with-toc' : ''}`}>
            <ReadingTableOfContents headings={readingContent.headings} />
            <div className="topic-reading-column">
              <article className="topic-reading-article">
                <header className="border-b border-slate-200 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <TopicTypeBadge type={topic.type} />
                    {topic.isPinned && <span className="font-semibold text-blue-700">Đã ghim</span>}
                    {topic.isDiscussionLocked && <span className="font-semibold text-slate-500">Đã khóa thảo luận</span>}
                    {user?.id === topic.author.id && <Link className="ml-auto font-semibold text-blue-700 hover:underline" to={appRoutes.editTopic(topic.id)}>Chỉnh sửa nội dung</Link>}
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
                    <time dateTime={topic.publishedAtUtc}>{formatDateTime(topic.publishedAtUtc)}</time>
                    <span aria-hidden="true">·</span>
                    <Link className="hover:text-blue-700" to={`${topic.type === 'question' ? appRoutes.questions : appRoutes.articles}?categoryId=${topic.category.id}`}>{topic.category.name}</Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span title="Thời gian ước tính tùy theo nội dung và tốc độ đọc.">Khoảng {Math.max(1, readingContent.readingMinutes)} phút đọc</span>
                    {wasUpdatedAfterPublication && topic.updatedAtUtc && (
                      <time dateTime={topic.updatedAtUtc}>Cập nhật {formatDateTime(topic.updatedAtUtc)}</time>
                    )}
                  </div>
                  {topic.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topic.tags.map((tag) => (
                        <Link className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700" key={tag.id} to={`${appRoutes.search}?tagId=${tag.id}`}>
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </header>

                <div
                  className="fr-view reading-content p-6 text-base leading-8 text-slate-800 sm:p-8 [&_a]:text-blue-700 [&_a]:underline [&_p]:mb-5"
                  dangerouslySetInnerHTML={{ __html: readingContent.html }}
                />
                <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
                  <div className="flex flex-wrap gap-3">
                    <UsefulStarButton topicId={topic.id} />
                    <BookmarkButton topicId={topic.id} />
                    <ReportAction targetId={topic.id} targetType="topic" />
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <TopicEngagementBar
                      initial={{ viewCount: topic.viewCount, shareCount: topic.shareCount }}
                      title={topic.title}
                      topicId={topic.id}
                    />
                  </div>
                </footer>
              </article>
              <DiscussionSection
                isLocked={topic.isDiscussionLocked}
                key={topic.id}
                topicAuthorId={topic.author.id}
                topicId={topic.id}
                topicType={topic.type}
              />
              <RelatedTopics key={`related-${topic.id}`} topicId={topic.id} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
