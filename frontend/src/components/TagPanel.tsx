import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Tag } from '../api/tags'
import { Link } from 'react-router-dom'
import { appRoutes } from '../appRoutes'

interface TagPanelProps {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  selectedId?: string
  onSelect?: (id: string) => void
}

const messageSx = { p: 2.5, color: 'text.secondary', fontSize: '0.875rem', lineHeight: '1.5rem' } as const

export const TagPanel = ({ tags, isLoading, error, onRetry, selectedId, onSelect }: TagPanelProps) => {
  return (
    <Box aria-labelledby="tag-title" className="surface-card" component="section">
      <Box sx={{ px: 2, py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
        <Typography component="h2" id="tag-title" sx={{ color: 'var(--color-heading)', fontSize: '0.95rem', fontWeight: 700 }}>
          Thẻ công nghệ
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.75rem', lineHeight: '1.25rem' }}>
          Các thẻ đang được sử dụng trên TechForum.
        </Typography>
        <MuiLink
          component={Link}
          sx={{ display: 'inline-block', mt: 1, fontSize: '0.875rem', fontWeight: 600 }}
          to={appRoutes.communities}
          underline="hover"
        >
          Xem tất cả cộng đồng →
        </MuiLink>
      </Box>

      {isLoading && <Box role="status" sx={messageSx}>Đang tải thẻ…</Box>}
      {!isLoading && error && (
        <Stack role="alert" spacing={1.5} sx={{ ...messageSx, alignItems: 'flex-start' }}>
          <Typography sx={{ m: 0, fontSize: 'inherit' }}>{error}</Typography>
          <Button variant="outlined" onClick={onRetry}>Thử lại</Button>
        </Stack>
      )}
      {!isLoading && !error && tags.length === 0 && (
        <Box sx={messageSx}>Chưa có thẻ đang hoạt động.</Box>
      )}
      {!isLoading && !error && tags.length > 0 && (
        <Stack component="ul" direction="row" sx={{ m: 0, p: 2, flexWrap: 'wrap', gap: 1, listStyle: 'none' }}>
          {tags.map((tag) => (
            <li key={tag.id}>
              {onSelect ? (
                <Chip
                  aria-pressed={selectedId === tag.id}
                  clickable
                  color={selectedId === tag.id ? 'primary' : 'default'}
                  label={`#${tag.name}`}
                  onClick={() => onSelect(tag.id)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                  variant={selectedId === tag.id ? 'filled' : 'outlined'}
                />
              ) : (
                <Chip
                  clickable
                  color="primary"
                  component={Link}
                  label={`#${tag.name}`}
                  size="small"
                  sx={{ fontWeight: 700 }}
                  to={appRoutes.skill(tag.id)}
                  variant="outlined"
                />
              )}
            </li>
          ))}
        </Stack>
      )}
    </Box>
  )
}
