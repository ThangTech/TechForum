import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface StatTileProps {
  children: ReactNode
  size?: 'small' | 'large'
  // When given, the whole tile is a link.
  to?: string
}

// A light grey tile with a number and a label, for example "12 nội dung".
export const StatTile = ({ children, size = 'small', to }: StatTileProps) => {
  const sx = {
    display: 'block',
    px: 2,
    py: size === 'small' ? 1.5 : 2,
    borderRadius: '8px',
    bgcolor: 'var(--color-subtle)',
    color: 'text.primary',
    fontSize: '0.875rem',
    '& strong': { color: 'var(--color-heading)' },
  } as const

  if (to) {
    return (
      <MuiLink
        component={Link}
        sx={{ ...sx, '&:hover': { bgcolor: 'primary.light', color: 'primary.main', '& strong': { color: 'inherit' } } }}
        to={to}
        underline="none"
      >
        {children}
      </MuiLink>
    )
  }

  return <Box sx={sx}>{children}</Box>
}
