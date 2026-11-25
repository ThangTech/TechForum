import Stack from '@mui/material/Stack'
import { PageShell } from '../../../shared/components/PageShell'
import { Pager } from '../../../shared/components/Pager'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { SkillMemberList } from '../components/SkillMemberList'
import { SkillSummary } from '../components/SkillSummary'
import { useSkillCommunityPage } from '../hooks/useSkillCommunityPage'

export const SkillCommunityPage = () => {
  const { isValidId, data, visibleError, visibleLoading, notFoundTitle, retry, changePage } = useSkillCommunityPage()

  return (
    <PageShell compact maxWidth={1240}>
      {/* The retry button only makes sense when the address is valid. */}
      <AsyncStatePanel error={visibleError} isLoading={visibleLoading} loadingText="Đang tải kỹ năng…" notFoundTitle={notFoundTitle} onRetry={isValidId ? retry : undefined} />
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
