import Box, { type BoxProps } from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

export type PanelTone = 'default' | 'dashed' | 'success' | 'warning' | 'error' | 'info'

const toneBorders: Record<PanelTone, string> = {
  default: 'var(--color-border)',
  dashed: 'var(--color-border-strong)',
  success: 'var(--color-solved-border)',
  warning: 'var(--color-question-border)',
  error: 'var(--color-danger-border)',
  info: 'var(--color-primary-border)',
}

type PanelProps = BoxProps & {
  tone?: PanelTone
  // Only used when the panel is a form (component="form"): turns off the browser's own checks.
  noValidate?: boolean
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
