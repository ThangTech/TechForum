import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMyActivity, type ActivityPage as ActivityPageData } from '../api/activity'
import { ActivityList } from '../components/account/ActivityList'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const ActivityPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const [data, setData] = useState<ActivityPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getMyActivity(page, 20, controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải lịch sử hoạt động.')
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [page, requestVersion])

  const reload = () => { setIsLoading(true); setError(null); setRequestVersion((value) => value + 1) }
  const changePage = (next: number) => { setIsLoading(true); setError(null); setSearchParams(next <= 1 ? {} : { page: String(next) }) }

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <header className="mb-6"><p className="eyebrow">Tài khoản cá nhân</p><h1 className="mt-1 text-2xl font-extrabold text-slate-950">Lịch sử hoạt động</h1><p className="mt-2 text-sm text-slate-600">Các bài viết, câu hỏi và câu trả lời công khai của bạn.</p></header>
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải lịch sử…</div>}
        {!isLoading && error && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-4"><Button label="Thử lại" onClick={reload} variant="secondary" /></div></div>}
        {!isLoading && !error && data && <ActivityList data={data} onPageChange={changePage} />}
      </div>
    </main>
  )
}
