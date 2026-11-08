import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TopicSummary } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { TopicTypeBadge } from './TopicTypeBadge'
import { topicTagChipSx } from './topicTagChipSx'
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
// Màu chữ đặt trên thẻ span để không bị style mặc định của thẻ <a> ghi đè.
const getAnswerBoxColors = (answerCount: number, hasAcceptedAnswer: boolean) => {
  if (hasAcceptedAnswer) return { border: 'success.main', background: 'success.main', text: '#fff' }
  if (answerCount > 0) return { border: 'success.main', background: 'transparent', text: 'success.main' }
  return { border: 'var(--color-border-strong)', background: 'transparent', text: 'text.secondary' }
}

const metaRowSx = { flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 1, color: 'text.secondary', fontSize: '0.75rem' } as const
const statLinkSx = { fontWeight: 600 } as const
export const TopicSummaryItem = ({
  topic,
  showAuthor = true,
  onFilter,
  isDiscussion = false,
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
            width: 64,
            height: 56,
            textAlign: 'center',
            border: 1,
            borderColor: answerColors.border,
            borderRadius: '6px',
            bgcolor: answerColors.background,
          }}
          to={discussionUrl}
          underline="none"
        >
          <Typography component="span" sx={{ color: answerColors.text, fontSize: '1.125rem', fontWeight: 700, lineHeight: '1.25rem' }}>
            {topic.discussion.answerCount}
          </Typography>
          <Typography component="span" sx={{ color: answerColors.text, fontSize: '0.7rem' }}>
            {topic.discussion.hasAcceptedAnswer ? 'đã giải' : 'trả lời'}
          </Typography>
        </MuiLink>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <TopicTypeBadge type={topic.type} />
          {topic.isPinned && <Chip color="primary" label="Đã ghim" size="small" sx={{ fontWeight: 600 }} variant="outlined" />}
          {topic.isDiscussionLocked && (
            <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
              Đã khóa thảo luận
            </Typography>
          )}
          {isQuestion && topic.discussion?.hasAcceptedAnswer && (
            <Chip label="✓ Đã có lời giải" size="small" sx={{ bgcolor: 'success.light', color: 'success.main', fontWeight: 700 }} />
          )}
        </Stack>
        <MuiLink
          component={Link}
          sx={{
            display: 'block',
            mt: 1.5,
            color: 'var(--color-heading)',
            fontSize: '1.125rem',
            fontWeight: 700,
            lineHeight: '1.75rem',
            '&:hover': { color: 'primary.main' },
          }}
          to={appRoutes.topic(topic.id)}
          underline="none"
        >
          {topic.title}
        </MuiLink>
        {!isDiscussion && (
          <Typography
            sx={{
              mt: 1,
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
        <Stack direction="row" sx={{ ...metaRowSx, mt: 2 }}>
          {showAuthor && (
            <>
              <MuiLink
                component={Link}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
                to={appRoutes.member(topic.author.id)}
                underline="none"
              >
                {/* Danh sách chủ đề chưa trả về ảnh đại diện nên hiển thị chữ cái đầu của tên. */}
                <UserAvatar avatarUrl={null} displayName={topic.author.displayName} size="xs" />
                {topic.author.displayName}
              </MuiLink>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatDate(topic.publishedAtUtc)}</span>
          <span aria-hidden="true">·</span>
          {onFilter ? (
            <MuiLink
              component="button"
              onClick={() => onFilter('categoryId', topic.category.id)}
              sx={{ fontSize: 'inherit', fontWeight: 600, verticalAlign: 'baseline' }}
              type="button"
              underline="hover"
            >
              {topic.category.name}
            </MuiLink>
          ) : (
            <span>{topic.category.name}</span>
          )}
        </Stack>
        <Stack className="topic-card__stats" direction="row" sx={{ ...metaRowSx, mt: 1.5, columnGap: 2 }}>
          <span className="topic-stat" title="Lượt xem"><ViewIcon />{topic.viewCount}<span className="sr-only"> lượt xem</span></span>
          {topic.discussion && <>
            <MuiLink
              component={Link}
              sx={{
                ...statLinkSx,
                display: { xs: 'inline-flex', sm: isQuestion ? 'none' : 'inline-flex' },
                alignItems: 'center',
                gap: '5px',
              }}
              title={isQuestion ? 'Câu trả lời và phản hồi' : 'Phản hồi'}
              to={discussionUrl}
              underline="hover"
            >
              <CommentIcon />{topic.discussion.answerCount}
              <span className="sr-only"> {isQuestion ? 'câu trả lời và phản hồi' : 'phản hồi'}</span>
            </MuiLink>
            <span className="topic-stat" title="Sao hữu ích"><StarIcon />{topic.discussion.starCount}<span className="sr-only"> sao hữu ích</span></span>
            <span className="topic-stat" title="Lượt lưu"><BookmarkIcon />{topic.discussion.bookmarkCount}<span className="sr-only"> lượt lưu</span></span>
            {isDiscussion && topic.discussion.lastActivityAtUtc && <time dateTime={topic.discussion.lastActivityAtUtc}>
              Trao đổi gần nhất: {new Date(topic.discussion.lastActivityAtUtc).toLocaleString('vi-VN')}
            </time>}
          </>}
        </Stack>
        {topic.tags.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {topic.tags.map((tag) => onFilter ? (
              <Chip key={tag.id} label={`#${tag.name}`} onClick={() => onFilter('tagId', tag.id)} size="small" sx={topicTagChipSx} variant="outlined" />
            ) : (
              <Chip key={tag.id} label={`#${tag.name}`} size="small" sx={topicTagChipSx} variant="outlined" />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
