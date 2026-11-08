import Chip from '@mui/material/Chip'
import type { TopicType } from '../../api/topics'

interface TopicTypeBadgeProps {
  type: TopicType
}

export const TopicTypeBadge = ({ type }: TopicTypeBadgeProps) => (
  <Chip
    label={type === 'question' ? 'Câu hỏi' : 'Bài viết'}
    size="small"
    sx={type === 'question'
      ? { bgcolor: 'var(--color-question-soft)', color: 'var(--color-question)', fontWeight: 700 }
      : { bgcolor: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)', fontWeight: 700 }}
  />
)
