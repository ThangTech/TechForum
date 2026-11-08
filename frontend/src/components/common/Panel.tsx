import Box, { type BoxProps } from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

export type PanelTone = 'default' | 'dashed' | 'success' | 'warning' | 'error' | 'info'

const toneBorders: Record<PanelTone, string> = {
  default: 'var(--color-border)',
  dashed: '#cbd5e1',
  success: '#bbf7d0',
  warning: '#fde68a',
  error: '#fecaca',
  info: '#bfdbfe',
}

type PanelProps = BoxProps & {
  tone?: PanelTone
}

// A white bordered box with rounded corners. It is the base of the cards on the personal pages.
export const Panel = ({ tone = 'default', sx, ...rest }: PanelProps) => {
  const base: SxProps<Theme> = {
    border: 1,
    borderStyle: tone === 'dashed' ? 'dashed' : 'solid',
    borderColor: toneBorders[tone],
    borderRadius: 2,
    bgcolor: 'background.paper',
    overflow: 'hidden',
  }
  return <Box {...rest} sx={[base, ...(Array.isArray(sx) ? sx : [sx])]} />
}
