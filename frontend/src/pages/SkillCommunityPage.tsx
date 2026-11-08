import Stack from '@mui/material/Stack'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { PageShell } from '../components/common/PageShell'
import { Pager } from '../components/common/Pager'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
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

  return (
    <PageShell compact maxWidth={1240}>
      {/* The retry button only makes sense when the address is valid. */}
      <AsyncStatePanel error={visibleError} isLoading={visibleLoading} loadingText="Đang tải kỹ năng…" onRetry={isValidId ? retry : undefined} />
      {!visibleLoading && !visibleError && data && (
        <Stack spacing={3}>
          <SkillSummary community={data} />
          <SkillMemberList members={data.members} />
          <Pager onChange={changePage} page={data.page} totalPages={data.totalPages} />
        </Stack>
      )}
    </PageShell>
  )
}
