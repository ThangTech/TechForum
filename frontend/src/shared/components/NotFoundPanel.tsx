import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../app/appRoutes'
import { EmptyStateIcon } from './EmptyStateIcon'
import { Panel } from './Panel'

interface NotFoundPanelProps {
  title?: string
  description?: string
}

// Trang hoặc nội dung không tồn tại: nói rõ lý do và chỉ đường đi tiếp, không có nút "Thử lại" vô ích.
// Báo công cụ tìm kiếm không lập chỉ mục trang này (trang web vẫn trả 200 vì là ứng dụng một trang).
export const NotFoundPanel = ({
  title = 'Không tìm thấy trang',
  description = 'Đường dẫn có thể đã sai, hoặc nội dung đã bị xóa hay không còn công khai.',
}: NotFoundPanelProps) => {
  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.appendChild(robots)
    return () => robots.remove()
  }, [])

  return (
    <Panel role="alert" sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }} tone="dashed">
      <EmptyStateIcon />
      <Typography component="h1" sx={{ mt: 1, color: 'var(--color-heading)', fontSize: '1.375rem', fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 440, mx: 'auto', lineHeight: 1.7 }} variant="body2">
        {description}
      </Typography>
      <Stack direction="row" sx={{ mt: 3, justifyContent: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Button component={Link} to={appRoutes.home} variant="contained">Về trang chủ</Button>
        <Button component={Link} to={appRoutes.search} variant="outlined">Tìm nội dung</Button>
      </Stack>
    </Panel>
  )
}
