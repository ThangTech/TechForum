import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { NotFoundPanel } from '../components/NotFoundPanel'

interface AsyncStatePanelProps {
  error: string | null
  isLoading: boolean
  loadingText: string
  // Without it the panel shows the error but no retry button.
  onRetry?: () => void
  // Nội dung không tồn tại (404 hoặc đường dẫn sai): hiện khung "không tìm thấy" thay cho lỗi, không có nút thử lại.
  notFoundTitle?: string | null
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
  notFoundTitle = null,
}: AsyncStatePanelProps) => {
  if (!isLoading && error && notFoundTitle) {
    return <NotFoundPanel description={error} title={notFoundTitle} />
  }

  if (isLoading) {
    return (
      <Box role="status" sx={{ ...panelSx, borderColor: 'divider' }}>
        <Typography color="text.secondary" variant="body2">{loadingText}</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Stack role="alert" spacing={2} sx={{ ...panelSx, alignItems: 'center', borderColor: 'var(--color-danger-border)' }}>
        <Typography color="error" variant="body2">{error}</Typography>
        {onRetry && <Button onClick={onRetry} variant="outlined">Thử lại</Button>}
      </Stack>
    )
  }

  return null
}
