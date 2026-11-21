import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { Panel } from '../../../shared/components/Panel'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { NotificationList } from '../components/NotificationList'
import { useNotificationsPage } from '../hooks/useNotificationsPage'

export const NotificationsPage = () => {
  const view = useNotificationsPage()
  const { data, opened } = view

  return (
    <PageShell compact maxWidth={1240}>
      <Box sx={{ mb: 3 }}>
        <PageHeading
          description={data ? `${data.unreadCount} thông báo chưa đọc` : undefined}
          eyebrow="Tài khoản cá nhân"
          size="medium"
          title="Thông báo"
        />
        <MuiLink component={Link} sx={{ display: 'inline-block', mt: 1.5, fontSize: '0.875rem', fontWeight: 600 }} to="/reports" underline="hover">
          Theo dõi báo cáo của tôi
        </MuiLink>
      </Box>
      {opened && (
        <Panel
          aria-labelledby="notification-detail-heading"
          component="section"
          role="region"
          sx={{ mb: 3, p: 2.5, bgcolor: 'primary.light' }}
          tone="info"
        >
          <Typography component="h2" id="notification-detail-heading" sx={{ color: 'var(--color-heading)', fontWeight: 700 }}>{opened.title}</Typography>
          <Typography sx={{ mt: 1, color: 'text.primary', lineHeight: '1.5rem', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }} variant="body2">{opened.message}</Typography>
          <Box sx={{ mt: 2 }}><Button onClick={view.closeOpened} variant="outlined">Đóng chi tiết</Button></Box>
        </Panel>
      )}
      <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải thông báo…" onRetry={view.retry} />
      {!view.isLoading && !view.error && data && <NotificationList busyId={view.busyId} data={data} onOpen={(id, link, isRead) => void view.open(id, link, isRead)} onPageChange={view.changePage} />}
    </PageShell>
  )
}
