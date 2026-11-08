import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { Panel } from '../components/common/Panel'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { NotificationList } from '../components/notifications/NotificationList'
import { getErrorMessage } from '../queries/errorMessage'
import { useMarkNotificationRead, useNotifications } from '../queries/notifications'
import { isInitialLoading } from '../queries/status'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const safeNotificationLink = (value: string) =>
  /^\/topics\/\d+(?:#answer-\d+)?$/.test(value) || value === '/reports' || value === '/notifications' ? value : '/'

export const NotificationsPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const notificationsQuery = useNotifications(page, 10)
  const markReadMutation = useMarkNotificationRead()
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [openedId, setOpenedId] = useState<number | null>(null)
  const data = notificationsQuery.data ?? null
  const isLoading = isInitialLoading(notificationsQuery)
  const error = actionError ?? getErrorMessage(notificationsQuery.error, 'Không thể tải thông báo.')
  const openedNotification = data?.items.find((item) => item.id === openedId)

  const changePage = (nextPage: number) => {
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) })
  }

  const retry = () => {
    setActionError(null)
    void notificationsQuery.refetch()
  }

  const openNotification = async (id: number, link: string, isRead: boolean) => {
    if (busyId !== null) return
    setBusyId(id); setActionError(null)
    try {
      if (!isRead) {
        // The list and the unread count in the header load again after this.
        await markReadMutation.mutateAsync(id)
      }
      const destination = safeNotificationLink(link)
      if (destination === '/notifications') setOpenedId(id)
      else navigate(destination)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể mở thông báo.')
    } finally {
      setBusyId(null)
    }
  }

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
      {openedNotification && (
        <Panel
          aria-labelledby="notification-detail-heading"
          component="section"
          role="region"
          sx={{ mb: 3, p: 2.5, bgcolor: 'primary.light' }}
          tone="info"
        >
          <Typography component="h2" id="notification-detail-heading" sx={{ color: 'var(--color-heading)', fontWeight: 700 }}>{openedNotification.title}</Typography>
          <Typography sx={{ mt: 1, color: 'text.primary', lineHeight: '1.5rem', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }} variant="body2">{openedNotification.message}</Typography>
          <Box sx={{ mt: 2 }}><Button onClick={() => setOpenedId(null)} variant="outlined">Đóng chi tiết</Button></Box>
        </Panel>
      )}
      <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải thông báo…" onRetry={retry} />
      {!isLoading && !error && data && <NotificationList busyId={busyId} data={data} onOpen={(id, link, isRead) => void openNotification(id, link, isRead)} onPageChange={changePage} />}
    </PageShell>
  )
}
