import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface PageHeadingProps {
  eyebrow: string
  title: string
  description?: ReactNode
  // Buttons shown on the right of the heading.
  actions?: ReactNode
  // "large" is for the main title of a page, "medium" for the pages of the personal area.
  size?: 'large' | 'medium'
}

// The small label, the title and the short description at the top of a page.
export const PageHeading = ({ eyebrow, title, description, actions, size = 'large' }: PageHeadingProps) => (
  <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
    <Box>
      <p className="eyebrow">{eyebrow}</p>
      <Typography
        component="h1"
        sx={{
          color: 'var(--color-heading)',
          fontSize: size === 'large' ? '1.875rem' : '1.5rem',
          fontWeight: 800,
          letterSpacing: '-0.025em',
        }}
      >
        {title}
      </Typography>
      {description && <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">{description}</Typography>}
    </Box>
    {actions}
  </Stack>
)
