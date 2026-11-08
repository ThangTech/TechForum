import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import type { SxProps, Theme } from '@mui/material/styles'
import { Link } from 'react-router-dom'

interface InlineStatsProps {
  items: { value: number | string; label: string; to?: string }[]
  // Name of the list for screen readers, for example "Thống kê cộng đồng".
  label: string
  sx?: SxProps<Theme>
}

// Numbers shown as one quiet line of text, for example "8 thành viên  1 bài viết  2 câu hỏi".
// A number can be a link when `to` is given.
export const InlineStats = ({ items, label, sx }: InlineStatsProps) => (
  <Stack
    aria-label={label}
    component="ul"
    direction="row"
    sx={[
      { m: 0, p: 0, listStyle: 'none', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, color: 'text.secondary', fontSize: '0.875rem' },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {items.map((item) => {
      const content = <><Box component="strong" sx={{ color: 'var(--color-heading)', fontWeight: 700 }}>{item.value}</Box> {item.label}</>
      return (
        <li key={item.label}>
          {item.to ? (
            <MuiLink component={Link} sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }} to={item.to} underline="none">{content}</MuiLink>
          ) : content}
        </li>
      )
    })}
  </Stack>
)
