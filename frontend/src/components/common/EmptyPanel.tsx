import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { EmptyStateIcon } from './EmptyStateIcon'
import { Panel } from './Panel'

// The dashed box shown when a list has nothing to show. Extra content, such as a link, goes below the message.
export const EmptyPanel = ({ children, title }: { children?: ReactNode; title?: string }) => (
  <Panel sx={{ p: 5, textAlign: 'center' }} tone="dashed">
    <EmptyStateIcon />
    {title && <Typography component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>{title}</Typography>}
    {typeof children === 'string'
      ? <Typography color="text.secondary" variant="body2">{children}</Typography>
      : children}
  </Panel>
)
