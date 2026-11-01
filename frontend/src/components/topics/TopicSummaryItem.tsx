import { Link } from 'react-router-dom'
import type { TopicSummary } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { TopicTypeBadge } from './TopicTypeBadge'
import { UserAvatar } from '../account/UserAvatar'
import { BookmarkIcon, CommentIcon, StarIcon, ViewIcon } from '../common/StatIcons'

interface TopicSummaryItemProps {
  topic: TopicSummary
  showAuthor?: boolean
  onFilter?: (key: 'categoryId' | 'tagId', value: number) => void
  isDiscussion?: boolean
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
}).format(new Date(value))

// Ô số trả lời kiểu hỏi đáp: viền xám khi chưa có trả lời, viền xanh lá khi đã có, nền xanh lá khi đã có lời giải.
// Màu chữ đặt trên thẻ span vì style của thẻ <a> trong Astryx ghi đè màu chữ đặt trên chính Link.
const getAnswerBoxClasses = (answerCount: number, hasAcceptedAnswer: boolean) => {
  if (hasAcceptedAnswer) return { box: 'border-[var(--color-solved)] bg-[var(--color-solved)]', text: 'text-[#fff]' }
  if (answerCount > 0) return { box: 'border-[var(--color-solved)]', text: 'text-[var(--color-solved)]' }
  return { box: 'border-[var(--color-border-strong)]', text: 'text-[var(--color-muted)]' }
}

export const TopicSummaryItem = ({
  topic,
  showAuthor = true,
  onFilter,
  isDiscussion = false,
}: TopicSummaryItemProps) => {
  const answerBox = topic.discussion
    ? getAnswerBoxClasses(topic.discussion.answerCount, topic.discussion.hasAcceptedAnswer)
    : null

  return (
    <article className="flex gap-4">
      {topic.type === 'question' && topic.discussion && answerBox && (
        <Link
          aria-label={`${topic.discussion.answerCount} câu trả lời và phản hồi`}
          className={`hidden h-14 w-16 shrink-0 flex-col items-center justify-center rounded-md border text-center sm:flex ${answerBox.box}`}
          to={`${appRoutes.topic(topic.id)}#discussion-title`}
        >
          <span className={`text-lg font-bold leading-5 ${answerBox.text}`}>{topic.discussion.answerCount}</span>
          <span className={`text-[0.7rem] ${answerBox.text}`}>{topic.discussion.hasAcceptedAnswer ? 'đã giải' : 'trả lời'}</span>
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TopicTypeBadge type={topic.type} />
          {topic.isPinned && <span className="rounded-full border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">Đã ghim</span>}
          {topic.isDiscussionLocked && <span className="text-xs font-semibold text-slate-500">Đã khóa thảo luận</span>}
          {topic.type === 'question' && topic.discussion?.hasAcceptedAnswer && <span className="rounded-full bg-[var(--color-solved-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-solved)]">✓ Đã có lời giải</span>}
        </div>
        <Link className="mt-3 block text-lg font-bold leading-7 text-slate-950 hover:text-blue-700" to={appRoutes.topic(topic.id)}>
          {topic.title}
        </Link>
        {!isDiscussion && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{topic.summary}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
          {showAuthor && (
            <>
              <Link className="flex items-center gap-2 font-semibold text-slate-700 hover:text-blue-700" to={appRoutes.member(topic.author.id)}>
                {/* Danh sách chủ đề chưa trả về ảnh đại diện nên hiển thị chữ cái đầu của tên. */}
                <UserAvatar avatarUrl={null} displayName={topic.author.displayName} size="xs" />
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
        <div className="topic-card__stats mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="topic-stat" title="Lượt xem"><ViewIcon />{topic.viewCount}<span className="sr-only"> lượt xem</span></span>
          {topic.discussion && <>
            <Link className={`topic-stat font-semibold text-blue-700 hover:underline${topic.type === 'question' ? ' sm:hidden' : ''}`} title={topic.type === 'question' ? 'Câu trả lời và phản hồi' : 'Phản hồi'} to={`${appRoutes.topic(topic.id)}#discussion-title`}>
              <CommentIcon />{topic.discussion.answerCount}
              <span className="sr-only"> {topic.type === 'question' ? 'câu trả lời và phản hồi' : 'phản hồi'}</span>
            </Link>
            <span className="topic-stat" title="Sao hữu ích"><StarIcon />{topic.discussion.starCount}<span className="sr-only"> sao hữu ích</span></span>
            <span className="topic-stat" title="Lượt lưu"><BookmarkIcon />{topic.discussion.bookmarkCount}<span className="sr-only"> lượt lưu</span></span>
            {isDiscussion && topic.discussion.lastActivityAtUtc && <time dateTime={topic.discussion.lastActivityAtUtc}>
              Trao đổi gần nhất: {new Date(topic.discussion.lastActivityAtUtc).toLocaleString('vi-VN')}
            </time>}
          </>}
        </div>
        {topic.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topic.tags.map((tag) => onFilter ? (
              <button className="topic-tag px-2.5 py-1" key={tag.id} onClick={() => onFilter('tagId', tag.id)} type="button">
                #{tag.name}
              </button>
            ) : (
              <span className="topic-tag px-2.5 py-1" key={tag.id}>#{tag.name}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
