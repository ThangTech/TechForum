import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TopicFeedMode, TopicPage, TopicType } from '../api/topics'
import { Panel } from './common/Panel'
import { PanelList } from './common/PanelList'
import { TopicSummaryItem } from './topics/TopicSummaryItem'

interface TopicFeedProps {
  data: TopicPage | null
  error: string | null
  isLoading: boolean
  onPageChange: (page: number) => void
  onRetry: () => void
  onFilter: (key: 'categoryId' | 'tagId', value: number) => void
  selectedType?: TopicType
  isDiscussion?: boolean
  feed?: TopicFeedMode
  requiresLogin?: boolean
  loginUrl?: string
  onShowLatest?: () => void
}

export const TopicFeed = ({
  data,
  error,
  isLoading,
  onPageChange,
  onRetry,
  onFilter,
  selectedType,
  isDiscussion,
  feed = 'latest',
  requiresLogin = false,
  loginUrl = '/login',
  onShowLatest,
}: TopicFeedProps) => {
  return (
  <Stack aria-labelledby="topic-feed-title" component="section" data-tour="content-feed" spacing={1.5}>
    <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
      <Typography component="h2" id="topic-feed-title" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
        {selectedType === 'article' ? 'Bài viết' : selectedType === 'question' ? 'Câu hỏi' : 'Bài viết và câu hỏi'}
      </Typography>
      {isDiscussion && <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>Đang có trao đổi</Typography>}
    </Stack>

    {isLoading && (
      <Box className="surface-card" role="status" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">Đang tải nội dung…</Typography>
      </Box>
    )}
    {!isLoading && requiresLogin && (
      <Stack className="surface-card" spacing={1.5} sx={{ p: 3, alignItems: 'center', textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">Đăng nhập để xem nội dung từ những tác giả bạn đang theo dõi.</Typography>
        <Button component={Link} to={loginUrl} variant="contained">Đăng nhập</Button>
      </Stack>
    )}
    {!isLoading && !requiresLogin && error && (
      <Stack className="surface-card" role="alert" spacing={2} sx={{ p: 4, alignItems: 'center', textAlign: 'center' }}>
        <Typography color="error" variant="body2">{error}</Typography>
        <Button onClick={onRetry} variant="outlined">Thử lại</Button>
      </Stack>
    )}
    {!isLoading && !requiresLogin && !error && data?.items.length === 0 && (
      <Stack className="surface-card" spacing={1.5} sx={{ p: 3, alignItems: 'center', textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">{feed === 'following'
          ? 'Chưa có nội dung phù hợp từ những người bạn đang theo dõi. Hãy theo dõi tác giả trên trang cá nhân hoặc thử bỏ bớt bộ lọc.'
          : feed === 'weekly'
            ? 'Chưa có nội dung phù hợp nhận tương tác trong 7 ngày qua.'
            : 'Không tìm thấy nội dung phù hợp.'}</Typography>
        {feed !== 'latest' && (
          <MuiLink component="button" onClick={onShowLatest} sx={{ fontWeight: 600 }} type="button" underline="always">Xem Mới nhất</MuiLink>
        )}
        {data.totalItems > 0 && (
          <MuiLink
            component="button"
            onClick={() => onPageChange(Math.max(1, data.totalPages))}
            sx={{ fontWeight: 600 }}
            type="button"
            underline="always"
          >Về trang cuối có nội dung</MuiLink>
        )}
      </Stack>
    )}
    {!isLoading && !requiresLogin && !error && data && data.items.length > 0 && (
      <>
        <Panel>
          <PanelList>
            {data.items.map((topic) => (
              <Box
                component="li"
                key={topic.id}
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  py: 2,
                  bgcolor: topic.isPinned ? '#f5f9ff' : undefined,
                  '&:hover': { bgcolor: topic.isPinned ? '#edf4ff' : 'var(--color-subtle)' },
                }}
              >
                <TopicSummaryItem onFilter={onFilter} topic={topic} isDiscussion={isDiscussion} />
              </Box>
            ))}
          </PanelList>
        </Panel>
        <Stack
          aria-label="Phân trang nội dung"
          className="surface-card"
          component="nav"
          direction="row"
          sx={{ p: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, color: 'text.secondary', fontSize: '0.875rem' }}
        >
          <span>Trang {data.page} / {Math.max(data.totalPages, 1)} · {data.totalItems} nội dung</span>
          <Stack direction="row" spacing={1}>
            <Button disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)} variant="outlined">Trang trước</Button>
            <Button disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)} variant="outlined">Trang sau</Button>
          </Stack>
        </Stack>
      </>
    )}
  </Stack>
)
}
