import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

interface PageShellProps {
  // Widest size of the content in pixels. The content keeps a 20px gap on each side on small screens.
  maxWidth?: number
  // Less space above and below the content.
  compact?: boolean
  children: ReactNode
}

// The frame of a normal page: the <main> element and a centred column with space above and below.
export const PageShell = ({ maxWidth = 920, compact = false, children }: PageShellProps) => (
  <Box className="main-area" component="main" id="main-content">
    <Box sx={{ mx: 'auto', width: `min(${maxWidth}px, calc(100% - 40px))`, py: compact ? 5 : { xs: 5, sm: 7 } }}>
      {children}
    </Box>
  </Box>
)
