import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import { appRoutes } from '../../appRoutes'
import { getErrorMessage } from '../../queries/errorMessage'
import { useRelatedTopics } from '../../queries/relatedTopics'
import { isInitialLoading } from '../../queries/status'
import { TopicTypeBadge } from './TopicTypeBadge'

interface Props {
  topicId: number
}

export const RelatedTopics = ({ topicId }: Props) => {
  const relatedQuery = useRelatedTopics(topicId)
  const items = relatedQuery.data ?? []
  const isLoading = isInitialLoading(relatedQuery)
  const error = getErrorMessage(relatedQuery.error, 'Không thể tải nội dung liên quan.')

  return (
    <section aria-labelledby="related-topics-title" className="related-topics">
      <h2 id="related-topics-title">Đọc tiếp</h2>
      <p className="related-topics__description">Khám phá thêm nội dung có chung thẻ hoặc chuyên mục.</p>
      {isLoading && <p className="related-topics__state" role="status">Đang tìm nội dung liên quan…</p>}
      {!isLoading && error && (
        <div className="related-topics__state">
          <p role="alert">{error}</p>
          <Button onClick={() => void relatedQuery.refetch()} variant="outlined">Thử lại</Button>
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
