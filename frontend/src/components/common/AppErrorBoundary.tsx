import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lỗi render giao diện TechForum.', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box component="main" sx={{ mx: 'auto', display: 'grid', minHeight: '100vh', maxWidth: 672, px: 3, gap: 2, placeContent: 'center', textAlign: 'center' }}>
          <Typography component="h1" sx={{ color: 'text.primary', fontSize: '1.5rem', fontWeight: 700 }}>Không thể hiển thị trang này</Typography>
          <Typography color="text.secondary">
            Giao diện gặp lỗi ngoài dự kiến. Bạn có thể tải lại trang để thử lại.
          </Typography>
          <Box>
            <Button onClick={() => window.location.reload()} type="button" variant="contained">Tải lại trang</Button>
          </Box>
        </Box>
      )
    }

    return this.props.children
  }
}
