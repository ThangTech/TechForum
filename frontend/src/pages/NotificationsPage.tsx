import Button from '@mui/material/Button'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
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
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <header className="mb-6">
          <p className="eyebrow">Tài khoản cá nhân</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Thông báo</h1>
          {data && <p className="mt-2 text-sm text-slate-600">{data.unreadCount} thông báo chưa đọc</p>}
          <Link className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline" to="/reports">Theo dõi báo cáo của tôi</Link>
        </header>
        {openedNotification && (
          <section aria-labelledby="notification-detail-heading" className="mb-6 border border-blue-200 bg-blue-50 p-5" role="region">
            <h2 className="font-bold text-slate-950" id="notification-detail-heading">{openedNotification.title}</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{openedNotification.message}</p>
            <div className="mt-4"><Button onClick={() => setOpenedId(null)} variant="outlined">Đóng chi tiết</Button></div>
          </section>
        )}
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải thông báo…</div>}
        {!isLoading && error && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-4"><Button onClick={retry} variant="outlined">Thử lại</Button></div></div>}
        {!isLoading && !error && data && <NotificationList busyId={busyId} data={data} onOpen={(id, link, isRead) => void openNotification(id, link, isRead)} onPageChange={changePage} />}
      </div>
    </main>
  )
}
