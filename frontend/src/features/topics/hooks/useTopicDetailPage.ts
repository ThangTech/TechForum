import { useEffect, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { toDisplayMediaHtml } from '../../../shared/api/media'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { isGuid } from '../../../shared/utils/ids'
import { useAuth } from '../../auth/hooks/authState'
import { prepareReadingContent } from '../utils/readingContent'
import { useTopic } from './topics'

// The page of one post: the post, its body ready to read (with the table of contents), and the jump to a heading
// when the address ends with #heading-id.
export const useTopicDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const topicId = (id ?? '').toLowerCase()
  const isValidId = isGuid(topicId)
  const topicQuery = useTopic(topicId, isValidId)
  const topic = topicQuery.data ?? null
  const isLoading = isValidId && isInitialLoading(topicQuery)
  const requestError = topicQuery.error
  const loadError = requestError instanceof ApiError && requestError.status === 404
    ? 'Bài viết có thể đã bị tác giả xóa, bị ẩn vì vi phạm hoặc đường dẫn không đúng.'
    : getErrorMessage(requestError)
  const error = isValidId ? loadError : 'Đường dẫn nội dung không hợp lệ.'
  const isNotFound = !isValidId || (requestError instanceof ApiError && requestError.status === 404)
  const readingContent = useMemo(
    () => topic ? prepareReadingContent(toDisplayMediaHtml(topic.bodyHtml), topic.id) : null,
    [topic],
  )

  useEffect(() => {
    if (isLoading || error || topic?.id !== topicId || !readingContent) return
    const headingId = location.hash.slice(1)
    if (!readingContent.headings.some((heading) => heading.id === headingId)) return

    const heading = document.getElementById(headingId)
    heading?.scrollIntoView({ block: 'start' })
    heading?.focus({ preventScroll: true })
  }, [error, isLoading, location.hash, readingContent, topic?.id, topicId])

  return {
    topicId,
    topic,
    readingContent,
    isLoading,
    error,
    notFoundTitle: isNotFound ? 'Không tìm thấy nội dung' : null,
    retry: () => void topicQuery.refetch(),
    isTopicReady: !isLoading && !error && topic?.id === topicId && readingContent !== null,
    isOwnTopic: Boolean(topic && user?.id === topic.author.id),
    wasUpdatedAfterPublication: Boolean(topic?.updatedAtUtc &&
      new Date(topic.updatedAtUtc).getTime() > new Date(topic.publishedAtUtc).getTime()),
  }
}
