import type { TopicType } from '../../api/topics'

interface TopicTypeBadgeProps {
  type: TopicType
}

export const TopicTypeBadge = ({ type }: TopicTypeBadgeProps) => (
  <span className={type === 'question'
    ? 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800'
    : 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800'}>
    {type === 'question' ? 'Câu hỏi' : 'Bài viết'}
  </span>
)
