import type { SxProps, Theme } from '@mui/material/styles'

// Look of a "#tag" chip: a small pill with the monospace font, shared by the topic list and the topic page.
export const topicTagChipSx: SxProps<Theme> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  color: 'text.secondary',
  bgcolor: 'var(--color-subtle)',
  borderColor: 'divider',
}
