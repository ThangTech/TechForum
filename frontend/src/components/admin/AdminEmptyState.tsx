import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { EmptyStateIcon } from '../common/EmptyStateIcon'

interface AdminEmptyStateProps {
  children: ReactNode
  // Inside a panel that already has a border, the empty message does not draw its own.
  flat?: boolean
}

// The message shown when an admin list or panel has no rows.
export const AdminEmptyState = ({ children, flat = false }: AdminEmptyStateProps) => (
  <Box
    sx={{
      px: 2.5,
      py: 5.5,
      textAlign: 'center',
      color: 'var(--color-quiet)',
      lineHeight: 1.8,
      bgcolor: 'background.paper',
      border: flat ? 0 : 1,
      borderColor: 'var(--color-border)',
    }}
  >
    <EmptyStateIcon size={flat ? 34 : 40} />
    {children}
  </Box>
)
