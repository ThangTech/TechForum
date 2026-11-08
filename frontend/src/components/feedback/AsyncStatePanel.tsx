import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface AsyncStatePanelProps {
  error: string | null
  isLoading: boolean
  loadingText: string
  onRetry: () => void
}

const panelSx = {
  p: 5,
  textAlign: 'center',
  border: 1,
  borderRadius: 2,
  bgcolor: 'background.paper',
} as const

export const AsyncStatePanel = ({
  error,
  isLoading,
  loadingText,
  onRetry,
}: AsyncStatePanelProps) => {
  if (isLoading) {
    return (
      <Box role="status" sx={{ ...panelSx, borderColor: 'divider' }}>
        <Typography color="text.secondary" variant="body2">{loadingText}</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Stack role="alert" spacing={2} sx={{ ...panelSx, alignItems: 'center', borderColor: '#fecaca' }}>
        <Typography color="error" variant="body2">{error}</Typography>
        <Button onClick={onRetry} variant="outlined">Thử lại</Button>
      </Stack>
    )
  }

  return null
}
