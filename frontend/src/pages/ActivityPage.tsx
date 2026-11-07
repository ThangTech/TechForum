import Button from '@mui/material/Button'
import { useSearchParams } from 'react-router-dom'
import { ActivityList } from '../components/account/ActivityList'
import { useMyActivity } from '../queries/activity'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const ActivityPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const activityQuery = useMyActivity(page, 20)
  const data = activityQuery.data ?? null
  const isLoading = isInitialLoading(activityQuery)
  const error = getErrorMessage(activityQuery.error, 'Không thể tải lịch sử hoạt động.')

  const reload = () => void activityQuery.refetch()
  const changePage = (next: number) => setSearchParams(next <= 1 ? {} : { page: String(next) })

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <header className="mb-6"><p className="eyebrow">Tài khoản cá nhân</p><h1 className="mt-1 text-2xl font-extrabold text-slate-950">Lịch sử hoạt động</h1><p className="mt-2 text-sm text-slate-600">Các bài viết, câu hỏi và câu trả lời công khai của bạn.</p></header>
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải lịch sử…</div>}
        {!isLoading && error && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-4"><Button onClick={reload} variant="outlined">Thử lại</Button></div></div>}
        {!isLoading && !error && data && <ActivityList data={data} onPageChange={changePage} />}
      </div>
    </main>
  )
}
