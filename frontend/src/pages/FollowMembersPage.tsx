import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getFollowMembers, type FollowMemberPage } from '../api/profiles'
import { appRoutes } from '../appRoutes'
import { FollowMemberList } from '../components/profile/FollowMemberList'

interface FollowMembersPageProps {
  kind: 'followers' | 'following'
}

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const FollowMembersPage = ({ kind }: FollowMembersPageProps) => {
  const { userId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const [data, setData] = useState<FollowMemberPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getFollowMembers(userId, kind, page, controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError && requestError.status === 404
          ? 'Không tìm thấy hồ sơ thành viên này.'
          : requestError instanceof Error ? requestError.message : 'Không thể tải danh sách theo dõi.')
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [kind, page, userId, version])

  const changePage = (next: number) => {
    setIsLoading(true)
    setError(null)
    setSearchParams(next <= 1 ? {} : { page: String(next) })
  }
  const retry = () => {
    setIsLoading(true)
    setError(null)
    setVersion((value) => value + 1)
  }
  const title = kind === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(760px,calc(100%-40px))] py-10">
        <Link className="text-sm font-bold text-blue-700 hover:underline" to={appRoutes.member(userId)}>← Về hồ sơ</Link>
        <div className="mt-6">
          <p className="eyebrow">Cộng đồng</p>
          <h1 className="text-3xl font-extrabold text-slate-950">{title}</h1>
        </div>
        {isLoading && <p className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải thành viên…</p>}
        {!isLoading && error && <div className="mt-6 rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-4"><Button label="Thử lại" onClick={retry} variant="secondary" /></div></div>}
        {!isLoading && !error && data && <div className="mt-6 space-y-5">
          <p className="text-sm text-slate-600">{data.totalItems} thành viên</p>
          <FollowMemberList members={data.items} />
          {data.totalPages > 1 && <nav className="flex items-center justify-between" aria-label="Phân trang danh sách theo dõi"><Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => changePage(data.page - 1)} variant="secondary" /><span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span><Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => changePage(data.page + 1)} variant="secondary" /></nav>}
        </div>}
      </div>
    </main>
  )
}
