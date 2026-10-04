import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getSkillCommunity, type SkillCommunity } from '../api/skills'
import { SkillMemberList } from '../components/skills/SkillMemberList'
import { SkillSummary } from '../components/skills/SkillSummary'

const readPage = (value: string | null) => { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1 }

export const SkillCommunityPage = () => {
  const { tagId = '' } = useParams()
  const id = Number(tagId)
  const isValidId = Number.isInteger(id) && id > 0
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const [data, setData] = useState<SkillCommunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    if (!isValidId) return () => controller.abort()
    getSkillCommunity(id, page, controller.signal).then(setData).catch((requestError: unknown) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof ApiError && requestError.status === 404 ? 'Kỹ năng này không tồn tại hoặc đã ngừng sử dụng.' : requestError instanceof Error ? requestError.message : 'Không thể tải kỹ năng.')
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [id, isValidId, page, version])

  const changePage = (next: number) => { setIsLoading(true); setError(null); setSearchParams(next <= 1 ? {} : { page: String(next) }) }
  const retry = () => { setIsLoading(true); setError(null); setVersion((value) => value + 1) }

  const visibleError = isValidId ? error : 'Đường dẫn kỹ năng không hợp lệ.'
  const visibleLoading = isValidId && isLoading

  return <main className="main-area" id="main-content"><div className="page-content py-10">
    {visibleLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải kỹ năng…</div>}
    {!visibleLoading && visibleError && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{visibleError}</p>{isValidId && <div className="mt-4"><Button label="Thử lại" onClick={retry} variant="secondary" /></div>}</div>}
    {!visibleLoading && !visibleError && data && <div className="space-y-6">
      <SkillSummary community={data} />
      <SkillMemberList members={data.members} />
      {data.totalPages > 1 && <div className="flex items-center justify-between"><Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => changePage(data.page - 1)} variant="secondary" /><span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span><Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => changePage(data.page + 1)} variant="secondary" /></div>}
    </div>}
  </div></main>
}
