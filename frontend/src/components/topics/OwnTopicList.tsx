import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { OwnTopicPage } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { Panel } from '../common/Panel'
import { PanelList } from '../common/PanelList'
import { TopicTypeBadge } from './TopicTypeBadge'

interface OwnTopicListProps {
  data: OwnTopicPage
  onDelete: (id: number) => void
  onPageChange: (page: number) => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
}).format(new Date(value))

const titleSx = { display: 'block', mt: 1.5, color: 'var(--color-heading)', fontSize: '1.125rem', fontWeight: 700 } as const

export const OwnTopicList = ({ data, onDelete, onPageChange }: OwnTopicListProps) => {
  if (data.items.length === 0) {
    return (
      <Panel sx={{ p: 5, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">Bạn chưa có nội dung phù hợp với bộ lọc.</Typography>
        <Button component={Link} sx={{ mt: 2 }} to={appRoutes.write} variant="contained">Viết nội dung đầu tiên</Button>
      </Panel>
    )
  }

  return (
    <Panel aria-label="Danh sách nội dung của tôi" component="section">
      <PanelList>
        {data.items.map((topic) => (
          <Box component="li" key={topic.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <TopicTypeBadge type={topic.type} />
              <Chip
                label={topic.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                size="small"
                sx={topic.status === 'published'
                  ? { bgcolor: 'success.light', color: 'success.main', fontWeight: 700 }
                  : { bgcolor: 'var(--color-hover)', color: 'text.primary', fontWeight: 700 }}
              />
              {topic.isHiddenByModerator && <Typography color="error" component="span" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Đã bị ẩn bởi quản trị viên</Typography>}
              {topic.isDiscussionLocked && <Typography color="text.secondary" component="span" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Đã khóa thảo luận</Typography>}
            </Stack>
            {topic.status === 'published' && !topic.isHiddenByModerator ? (
              <MuiLink component={Link} sx={{ ...titleSx, '&:hover': { color: 'primary.main' } }} to={appRoutes.topic(topic.id)} underline="none">
                {topic.title}
              </MuiLink>
            ) : (
              <Typography component="h2" sx={titleSx}>{topic.title}</Typography>
            )}
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">{topic.summary}</Typography>
            <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', columnGap: 1.5, rowGap: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
              <span>{topic.category.name}</span>
              <span aria-hidden="true">·</span>
              <span>Tạo {formatDate(topic.createdAtUtc)}</span>
              {topic.updatedAtUtc && <span>· Cập nhật {formatDate(topic.updatedAtUtc)}</span>}
            </Stack>
            {topic.tags.length > 0 && (
              <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                {topic.tags.map((tag) => (
                  <Chip key={tag.id} label={`#${tag.name}`} size="small" sx={{ bgcolor: 'var(--color-hover)', color: 'text.secondary', fontWeight: 600 }} />
                ))}
              </Stack>
            )}
            <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button component={Link} to={appRoutes.editTopic(topic.id)} variant="outlined">Chỉnh sửa</Button>
              <Button onClick={() => onDelete(topic.id)} variant="text">Xóa</Button>
            </Stack>
          </Box>
        ))}
      </PanelList>
      <Stack direction="row" sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', color: 'text.secondary', fontSize: '0.875rem' }}>
        <span>Trang {data.page} / {Math.max(data.totalPages, 1)} · {data.totalItems} nội dung</span>
        <Stack direction="row" spacing={1}>
          <Button disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)} variant="outlined">Trang trước</Button>
          <Button disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)} variant="outlined">Trang sau</Button>
        </Stack>
      </Stack>
    </Panel>
  )
}
