import Stack from '@mui/material/Stack'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { PageShell } from '../../../shared/components/PageShell'
import { Pager } from '../../../shared/components/Pager'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { SkillMemberList } from '../components/SkillMemberList'
import { SkillSummary } from '../components/SkillSummary'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { useSkillCommunity } from '../hooks/skills'
import { isInitialLoading } from '../../../shared/query/status'
import { isGuid } from '../../../shared/utils/ids'
import { usePageParam } from '../../../shared/hooks/usePageParam'

export const SkillCommunityPage = () => {
  const { tagId = '' } = useParams()
  const id = tagId.toLowerCase()
  const isValidId = isGuid(id)
  const [, setSearchParams] = useSearchParams()
  const page = usePageParam()
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
