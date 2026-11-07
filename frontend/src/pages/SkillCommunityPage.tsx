import Button from '@mui/material/Button'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { SkillMemberList } from '../components/skills/SkillMemberList'
import { SkillSummary } from '../components/skills/SkillSummary'
import { getErrorMessage } from '../queries/errorMessage'
import { useSkillCommunity } from '../queries/skills'
import { isInitialLoading } from '../queries/status'

const readPage = (value: string | null) => { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1 }

export const SkillCommunityPage = () => {
  const { tagId = '' } = useParams()
  const id = Number(tagId)
  const isValidId = Number.isInteger(id) && id > 0
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const communityQuery = useSkillCommunity(id, page, isValidId)
  const data = communityQuery.data ?? null

  const changePage = (next: number) => { setSearchParams(next <= 1 ? {} : { page: String(next) }) }
  const retry = () => { void communityQuery.refetch() }

  const requestError = communityQuery.error
  const error = requestError instanceof ApiError && requestError.status === 404
    ? 'Kỹ năng này không tồn tại hoặc đã ngừng sử dụng.'
    : getErrorMessage(requestError, 'Không thể tải kỹ năng.')
  const visibleError = isValidId ? error : 'Đường dẫn kỹ năng không hợp lệ.'
  const visibleLoading = isValidId && isInitialLoading(communityQuery)

  return <main className="main-area" id="main-content"><div className="page-content py-10">
    {visibleLoading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải kỹ năng…</div>}
    {!visibleLoading && visibleError && <div className="rounded-xl border border-red-200 bg-white p-8 text-center" role="alert"><p className="text-sm text-red-700">{visibleError}</p>{isValidId && <div className="mt-4"><Button onClick={retry} variant="outlined">Thử lại</Button></div>}</div>}
    {!visibleLoading && !visibleError && data && <div className="space-y-6">
      <SkillSummary community={data} />
      <SkillMemberList members={data.members} />
      {data.totalPages > 1 && <div className="flex items-center justify-between"><Button disabled={data.page <= 1} onClick={() => changePage(data.page - 1)} variant="outlined">Trang trước</Button><span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span><Button disabled={data.page >= data.totalPages} onClick={() => changePage(data.page + 1)} variant="outlined">Trang sau</Button></div>}
    </div>}
  </div></main>
}
