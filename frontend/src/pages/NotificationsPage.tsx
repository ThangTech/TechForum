import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getNotifications, markNotificationRead, type NotificationPage } from '../api/notifications'
import { NotificationList } from '../components/notifications/NotificationList'
import { notificationsChangedEvent } from '../components/notifications/NotificationLink'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const safeNotificationLink = (value: string) => /^\/topics\/\d+(?:#answer-\d+)?$/.test(value) ? value : '/'

export const NotificationsPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const [data, setData] = useState<NotificationPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getNotifications(page, 10, controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải thông báo.')
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [page, requestVersion])

  const changePage = (nextPage: number) => {
    setIsLoading(true)
    setError(null)
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) })
  }

  const retry = () => {
    setIsLoading(true)
    setError(null)
    setRequestVersion((value) => value + 1)
  }

  const openNotification = async (id: number, link: string, isRead: boolean) => {
    if (busyId !== null) return
    setBusyId(id); setError(null)
    try {
      if (!isRead) {
        await markNotificationRead(id)
        window.dispatchEvent(new Event(notificationsChangedEvent))
      }
      navigate(safeNotificationLink(link))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể mở thông báo.')
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
        </header>
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải thông báo…</div>}
        {!isLoading && error && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-4"><Button label="Thử lại" onClick={retry} variant="secondary" /></div></div>}
        {!isLoading && !error && data && <NotificationList busyId={busyId} data={data} onOpen={(id, link, isRead) => void openNotification(id, link, isRead)} onPageChange={changePage} />}
      </div>
    </main>
  )
}
