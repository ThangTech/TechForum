import MuiLink from '@mui/material/Link'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// A small link at the top of a page that goes back to the list, for example "← Về hồ sơ".
export const BackLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to={to} underline="hover">{children}</MuiLink>
)
