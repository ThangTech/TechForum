import Box from '@mui/material/Box'

// An empty inbox, drawn with lines. It is put over a message when a list has nothing to show, so the place does not
// look broken. It is decoration only: the message beside it says the same thing in words.
export const EmptyStateIcon = ({ size = 44 }: { size?: number }) => (
  <Box
    aria-hidden="true"
    component="svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    sx={{ display: 'block', mx: 'auto', mb: 1.25, width: size, height: size, color: 'var(--color-quiet)', opacity: 0.8 }}
    viewBox="0 0 24 24"
  >
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </Box>
)
