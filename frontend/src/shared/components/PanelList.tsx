import Box, { type BoxProps } from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

type PanelListProps = BoxProps<'ul' | 'ol'> & {
  ordered?: boolean
}

// A list whose items are separated by a thin line, for example the rows inside a Panel.
export const PanelList = ({ ordered = false, sx, ...rest }: PanelListProps) => {
  const base: SxProps<Theme> = {
    m: 0,
    p: 0,
    listStyle: 'none',
    '& > li + li': { borderTop: 1, borderColor: 'divider' },
  }
  return <Box component={ordered ? 'ol' : 'ul'} {...rest} sx={[base, ...(Array.isArray(sx) ? sx : [sx])]} />
}
