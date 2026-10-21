import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@astryxdesign/core'
import { getRelatedTopics, type RelatedTopic } from '../../api/relatedTopics'
import { appRoutes } from '../../appRoutes'
import { TopicTypeBadge } from './TopicTypeBadge'

interface Props {
  topicId: number
}

export const RelatedTopics = ({ topicId }: Props) => {
  const [items, setItems] = useState<RelatedTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const topics = await getRelatedTopics(topicId, controller.signal)
        if (!controller.signal.aborted) setItems(topics)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải nội dung liên quan.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [topicId, requestVersion])

  return (
    <section aria-labelledby="related-topics-title" className="related-topics">
      <h2 id="related-topics-title">Đọc tiếp</h2>
      <p className="related-topics__description">Khám phá thêm nội dung có chung thẻ hoặc chuyên mục.</p>
      {isLoading && <p className="related-topics__state" role="status">Đang tìm nội dung liên quan…</p>}
      {!isLoading && error && (
        <div className="related-topics__state">
          <p role="alert">{error}</p>
          <Button label="Thử lại" onClick={() => setRequestVersion((value) => value + 1)} variant="secondary" />
        </div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <p className="related-topics__state">Chưa có nội dung liên quan. Bạn có thể khám phá thêm trong <Link to={appRoutes.articles}>danh sách bài viết</Link>.</p>
      )}
      {!isLoading && !error && items.length > 0 && (
        <div className="related-topics__grid">
          {items.map((topic) => (
            <article className="related-topics__item" key={topic.id}>
              <div className="related-topics__meta">
                <TopicTypeBadge type={topic.type} />
                <span>{topic.sharedTagCount > 0 ? `${topic.sharedTagCount} thẻ chung` : 'Cùng chuyên mục'}</span>
              </div>
              <h3><Link to={appRoutes.topic(topic.id)}>{topic.title}</Link></h3>
              <p className="related-topics__summary">{topic.summary}</p>
              <p className="related-topics__byline">
                <Link to={appRoutes.member(topic.author.id)}>{topic.author.displayName}</Link>
                <span aria-hidden="true"> · </span>
                <span>{topic.category.name}</span>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
