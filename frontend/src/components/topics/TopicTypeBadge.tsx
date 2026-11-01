import type { TopicType } from '../../api/topics'

interface TopicTypeBadgeProps {
  type: TopicType
}

export const TopicTypeBadge = ({ type }: TopicTypeBadgeProps) => (
  <span className={type === 'question'
    ? 'rounded-full bg-[var(--color-question-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-question)]'
    : 'rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary-dark)]'}>
    {type === 'question' ? 'Câu hỏi' : 'Bài viết'}
  </span>
)
