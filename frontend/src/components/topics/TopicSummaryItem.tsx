import { Link } from 'react-router-dom'
import type { TopicSummary } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { TopicTypeBadge } from './TopicTypeBadge'

interface TopicSummaryItemProps {
  topic: TopicSummary
  showAuthor?: boolean
  onFilter?: (key: 'categoryId' | 'tagId', value: number) => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
}).format(new Date(value))

export const TopicSummaryItem = ({
  topic,
  showAuthor = true,
  onFilter,
}: TopicSummaryItemProps) => (
  <article>
    <div className="flex flex-wrap items-center gap-2">
      <TopicTypeBadge type={topic.type} />
      {topic.isPinned && <span className="text-xs font-semibold text-blue-700">Đã ghim</span>}
      {topic.isDiscussionLocked && <span className="text-xs font-semibold text-slate-500">Đã khóa thảo luận</span>}
    </div>
    <Link className="mt-3 block text-lg font-bold leading-7 text-slate-950 hover:text-blue-700" to={appRoutes.topic(topic.id)}>
      {topic.title}
    </Link>
    <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p>
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
      {showAuthor && (
        <>
          <Link className="font-semibold text-slate-700 hover:text-blue-700" to={appRoutes.member(topic.author.id)}>
            {topic.author.displayName}
          </Link>
          <span aria-hidden="true">·</span>
        </>
      )}
      <span>{formatDate(topic.publishedAtUtc)}</span>
      <span aria-hidden="true">·</span>
      {onFilter ? (
        <button className="font-semibold text-blue-700 hover:underline" onClick={() => onFilter('categoryId', topic.category.id)} type="button">
          {topic.category.name}
        </button>
      ) : (
        <span>{topic.category.name}</span>
      )}
    </div>
    {topic.tags.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-2">
        {topic.tags.map((tag) => onFilter ? (
          <button className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700" key={tag.id} onClick={() => onFilter('tagId', tag.id)} type="button">
            #{tag.name}
          </button>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" key={tag.id}>#{tag.name}</span>
        ))}
      </div>
    )}
  </article>
)
