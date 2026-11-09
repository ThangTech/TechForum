import Box from '@mui/material/Box'
import { getTagCover } from './tagCoverStyle'

// The atom of React: three ellipses that cross and a circle in the middle, drawn with lines so it needs no image file.
const ReactAtom = () => (
  <Box
    aria-hidden="true"
    component="svg"
    fill="none"
    stroke="#61dafb"
    strokeWidth="1.6"
    sx={{ width: '38%', maxHeight: '70%', opacity: 0.95 }}
    viewBox="-12 -12 24 24"
  >
    <circle cx="0" cy="0" fill="#61dafb" r="1.8" stroke="none" />
    <ellipse cx="0" cy="0" rx="10" ry="4" />
    <ellipse cx="0" cy="0" rx="10" ry="4" transform="rotate(60)" />
    <ellipse cx="0" cy="0" rx="10" ry="4" transform="rotate(120)" />
  </Box>
)

// The cover of a topic that has no picture (for example one that only has a video): the colour and the mark of its tag.
export const TagCover = ({ tag }: { tag: { slug: string; name: string } }) => {
  const cover = getTagCover(tag)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        width: '100%',
        height: '100%',
        background: cover.background,
        color: '#fff',
        userSelect: 'none',
      }}
    >
      {cover.symbol === 'react'
        ? <ReactAtom />
        : (
          <Box
            component="span"
            sx={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 800,
              letterSpacing: '0.02em',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
            }}
          >
            {cover.label}
          </Box>
        )}
    </Box>
  )
}
