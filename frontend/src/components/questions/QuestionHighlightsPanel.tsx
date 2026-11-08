import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { QuestionHighlight, QuestionHighlights } from '../../api/questionHighlights'
import { appRoutes } from '../../appRoutes'
import { PanelList } from '../common/PanelList'

interface QuestionHighlightsPanelProps {
  data: QuestionHighlights | null
  error: string | null
  isLoading: boolean
  onRetry: () => void
}

// The grey strip that names a group of questions.
const groupTitleSx = {
  px: 2.5,
  py: 1,
  bgcolor: 'var(--color-subtle)',
  color: 'text.secondary',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.025em',
  textTransform: 'uppercase',
} as const

const QuestionList = ({ items }: { items: QuestionHighlight[] }) => items.length === 0
  ? <Typography color="text.secondary" sx={{ px: 2.5, py: 2.5 }} variant="body2">Chưa có câu hỏi phù hợp.</Typography>
  : (
    <PanelList ordered>
      {items.map((item) => (
        <Box component="li" key={item.id} sx={{ px: 2.5, py: 2 }}>
          <MuiLink
            component={Link}
            sx={{
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 700,
              lineHeight: '1.25rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              '&:hover': { color: 'primary.main' },
            }}
            to={appRoutes.topic(item.id)}
            underline="none"
          >
            {item.title}
          </MuiLink>
          <Typography color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>{item.answerCount} câu trả lời</Typography>
        </Box>
      ))}
    </PanelList>
  )

export const QuestionHighlightsPanel = ({ data, error, isLoading, onRetry }: QuestionHighlightsPanelProps) => (
  <Box aria-labelledby="question-highlights-title" className="surface-card" component="section">
    <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography component="h2" id="question-highlights-title" sx={{ color: 'var(--color-heading)', fontWeight: 700 }}>Câu hỏi cộng đồng</Typography>
    </Box>
    {isLoading && <Typography color="text.secondary" role="status" sx={{ px: 2.5, py: 4, textAlign: 'center' }} variant="body2">Đang tải câu hỏi…</Typography>}
    {!isLoading && error && (
      <Box role="alert" sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
        <Typography color="error" variant="body2">{error}</Typography>
        <Box sx={{ mt: 1.5 }}><Button onClick={onRetry} variant="outlined">Thử lại</Button></Box>
      </Box>
    )}
    {!isLoading && !error && data && (
      <>
        <Box sx={groupTitleSx}>Mới nhất</Box>
        <QuestionList items={data.latest} />
        <Box sx={{ ...groupTitleSx, borderTop: 1, borderColor: 'divider' }}>Nhiều câu trả lời · {data.periodDays} ngày</Box>
        <QuestionList items={data.mostAnswered} />
      </>
    )}
  </Box>
)
