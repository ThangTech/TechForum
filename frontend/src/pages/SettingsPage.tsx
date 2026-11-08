import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { PageShell } from '../components/common/PageShell'
import { Panel } from '../components/common/Panel'

export const SettingsPage = () => {
  const navigate = useNavigate()

  return (
    <PageShell compact maxWidth={1240}>
      <Panel component="section" sx={{ mx: 'auto', maxWidth: 672, p: { xs: 3, sm: 4 } }}>
        <p className="eyebrow">Tùy chỉnh</p>
        <Typography component="h1" sx={{ mt: 0.5, color: 'var(--color-heading)', fontSize: '1.5rem', fontWeight: 800 }}>Trải nghiệm TechForum</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: '1.5rem' }} variant="body2">
          Xem lại hướng dẫn ngắn về tìm kiếm, duyệt nội dung, viết bài và quản lý tài khoản.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate(`${appRoutes.home}?tour=1`)} variant="contained">Chạy lại hướng dẫn</Button>
        </Box>
      </Panel>
    </PageShell>
  )
}
