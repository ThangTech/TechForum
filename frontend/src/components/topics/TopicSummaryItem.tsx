import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TopicSummary } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { UserAvatar } from '../account/UserAvatar'
import { BookmarkIcon, CommentIcon, StarIcon, ViewIcon } from '../common/StatIcons'

interface TopicSummaryItemProps {
  topic: TopicSummary
  showAuthor?: boolean
  onFilter?: (key: 'categoryId' | 'tagId', value: number) => void
  isDiscussion?: boolean
  // The tabs Hot and Top order by the score, so the card shows it (a dot while it is hidden for a new post).
  showScore?: boolean
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
}).format(new Date(value))

// Ô số trả lời kiểu hỏi đáp: viền xám khi chưa có trả lời, viền xanh lá khi đã có, nền xanh lá khi đã có lời giải.
// Màu chữ đặt trên thẻ span để không bị style mặc định của thẻ <a> ghi đè.
const getAnswerBoxColors = (answerCount: number, hasAcceptedAnswer: boolean) => {
  if (hasAcceptedAnswer) return { border: 'success.main', background: 'success.main', text: 'var(--color-on-primary)' }
  if (answerCount > 0) return { border: 'success.main', background: 'transparent', text: 'success.main' }
  return { border: 'var(--color-border-strong)', background: 'transparent', text: 'text.secondary' }
}

// The small grey line under the summary: kind, author, date, category and tags on the left, the counters on the right.
const metaRowSx = {
  mt: 1,
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: 1.5,
  rowGap: 0.5,
  color: 'var(--color-quiet)',
  fontSize: '0.75rem',
} as const

const quietLinkSx = { color: 'inherit', '&:hover': { color: 'primary.main' } } as const

export const TopicSummaryItem = ({
  topic,
  showAuthor = true,
  onFilter,
  isDiscussion = false,
  showScore = false,
}: TopicSummaryItemProps) => {
  const answerColors = topic.discussion
    ? getAnswerBoxColors(topic.discussion.answerCount, topic.discussion.hasAcceptedAnswer)
    : null
  const isQuestion = topic.type === 'question'
  const discussionUrl = `${appRoutes.topic(topic.id)}#discussion-title`

  return (
    <Stack component="article" direction="row" sx={{ gap: 2 }}>
      {isQuestion && topic.discussion && answerColors && (
        <MuiLink
          aria-label={`${topic.discussion.answerCount} câu trả lời và phản hồi`}
          component={Link}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: 56,
            height: 48,
            textAlign: 'center',
            border: 1,
            borderColor: answerColors.border,
            borderRadius: '4px',
            bgcolor: answerColors.background,
          }}
          to={discussionUrl}
          underline="none"
        >
          <Typography component="span" sx={{ color: answerColors.text, fontSize: '1rem', fontWeight: 700, lineHeight: '1.125rem' }}>
            {topic.discussion.answerCount}
          </Typography>
          <Typography component="span" sx={{ color: answerColors.text, fontSize: '0.6875rem' }}>
            {topic.discussion.hasAcceptedAnswer ? 'đã giải' : 'trả lời'}
          </Typography>
        </MuiLink>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <MuiLink
          component={Link}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'var(--color-heading)',
            fontSize: '1.0625rem',
            fontWeight: 700,
            lineHeight: '1.5rem',
            '&:hover': { color: 'primary.main' },
          }}
          to={appRoutes.topic(topic.id)}
          underline="none"
        >
          {topic.isPinned && (
            <Box
              component="span"
              sx={{ mr: 1, px: 0.75, py: '1px', border: 1, borderColor: 'primary.main', borderRadius: '3px', color: 'primary.main', fontSize: '0.6875rem', fontWeight: 600, verticalAlign: 'middle' }}
            >
              Ghim
            </Box>
          )}
          {topic.title}
        </MuiLink>
        {!isDiscussion && (
          <Typography
            sx={{
              mt: 0.5,
              color: 'text.secondary',
              lineHeight: '1.5rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            variant="body2"
          >
            {topic.summary}
          </Typography>
        )}
        <Stack direction="row" sx={metaRowSx}>
          <Box component="span" sx={{ color: isQuestion ? 'var(--color-question)' : 'primary.main', fontWeight: 600 }}>
            {isQuestion ? 'Câu hỏi' : 'Bài viết'}
          </Box>
          {isQuestion && topic.discussion?.hasAcceptedAnswer && (
            <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>✓ Đã có lời giải</Box>
          )}
          {topic.isDiscussionLocked && <span>Đã khóa thảo luận</span>}
          {showAuthor && (
            <MuiLink
              component={Link}
              sx={{ ...quietLinkSx, display: 'flex', alignItems: 'center', gap: 0.75 }}
              to={appRoutes.member(topic.author.id)}
              underline="none"
            >
              {/* Danh sách chủ đề chưa trả về ảnh đại diện nên hiển thị chữ cái đầu của tên. */}
              <UserAvatar avatarUrl={null} displayName={topic.author.displayName} size="xs" />
              {topic.author.displayName}
            </MuiLink>
          )}
          <span>{formatDate(topic.publishedAtUtc)}</span>
          {onFilter ? (
            <MuiLink
              component="button"
              onClick={() => onFilter('categoryId', topic.category.id)}
              sx={{ ...quietLinkSx, fontSize: 'inherit', verticalAlign: 'baseline' }}
              type="button"
              underline="none"
            >
              {topic.category.name}
            </MuiLink>
          ) : (
            <span>{topic.category.name}</span>
          )}
          {topic.tags.map((tag) => onFilter ? (
            <MuiLink
              component="button"
              key={tag.id}
              onClick={() => onFilter('tagId', tag.id)}
              sx={{ ...quietLinkSx, fontSize: 'inherit', verticalAlign: 'baseline' }}
              type="button"
              underline="none"
            >
              #{tag.name}
            </MuiLink>
          ) : (
            <span key={tag.id}>#{tag.name}</span>
          ))}
          <Stack direction="row" sx={{ ml: 'auto', alignItems: 'center', columnGap: 1.75, fontVariantNumeric: 'tabular-nums' }}>
            {showScore && (
              <span className="topic-stat" title={topic.scoreHidden ? 'Điểm được ẩn trong 2 giờ đầu' : 'Điểm bình chọn'}>
                ▲ {topic.scoreHidden ? '•' : topic.score ?? 0}
                <span className="sr-only"> {topic.scoreHidden ? 'điểm đang ẩn' : 'điểm'}</span>
              </span>
            )}
            <span className="topic-stat" title="Lượt xem"><ViewIcon />{topic.viewCount}<span className="sr-only"> lượt xem</span></span>
            {topic.discussion && <>
              <MuiLink
                component={Link}
                sx={{
                  ...quietLinkSx,
                  display: { xs: 'inline-flex', sm: isQuestion ? 'none' : 'inline-flex' },
                  alignItems: 'center',
                  gap: '5px',
                }}
                title={isQuestion ? 'Câu trả lời và phản hồi' : 'Phản hồi'}
                to={discussionUrl}
                underline="none"
              >
                <CommentIcon />{topic.discussion.answerCount}
                <span className="sr-only"> {isQuestion ? 'câu trả lời và phản hồi' : 'phản hồi'}</span>
              </MuiLink>
              <span className="topic-stat" title="Sao hữu ích"><StarIcon />{topic.discussion.starCount}<span className="sr-only"> sao hữu ích</span></span>
              <span className="topic-stat" title="Lượt lưu"><BookmarkIcon />{topic.discussion.bookmarkCount}<span className="sr-only"> lượt lưu</span></span>
            </>}
          </Stack>
        </Stack>
        {isDiscussion && topic.discussion?.lastActivityAtUtc && (
          <Typography component="time" dateTime={topic.discussion.lastActivityAtUtc} sx={{ display: 'block', mt: 0.5, color: 'var(--color-quiet)', fontSize: '0.75rem' }}>
            Trao đổi gần nhất: {new Date(topic.discussion.lastActivityAtUtc).toLocaleString('vi-VN')}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
