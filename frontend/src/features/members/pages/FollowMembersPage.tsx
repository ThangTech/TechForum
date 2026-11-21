import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { appRoutes } from '../../../app/appRoutes'
import { BackLink } from '../../../shared/components/BackLink'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { Pager } from '../../../shared/components/Pager'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { FollowMemberList } from '../components/FollowMemberList'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { useFollowMembers } from '../hooks/profiles'
import { isInitialLoading } from '../../../shared/query/status'
import { usePageParam } from '../../../shared/hooks/usePageParam'

interface FollowMembersPageProps {
  kind: 'followers' | 'following'
}

export const FollowMembersPage = ({ kind }: FollowMembersPageProps) => {
  const { userId = '' } = useParams()
  const [, setSearchParams] = useSearchParams()
  const page = usePageParam()
  const membersQuery = useFollowMembers(userId, kind, page)
  const data = membersQuery.data ?? null
  const isLoading = isInitialLoading(membersQuery)
  const requestError = membersQuery.error
  const error = requestError instanceof ApiError && requestError.status === 404
    ? 'Không tìm thấy hồ sơ thành viên này.'
    : getErrorMessage(requestError, 'Không thể tải danh sách theo dõi.')

  const changePage = (next: number) => {
    setSearchParams(next <= 1 ? {} : { page: String(next) })
  }
  const retry = () => {
    void membersQuery.refetch()
  }
  const title = kind === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'

  return (
    <PageShell compact maxWidth={760}>
      <BackLink to={appRoutes.member(userId)}>← Về hồ sơ</BackLink>
      <Box sx={{ mt: 3 }}>
        <PageHeading eyebrow="Cộng đồng" title={title} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải thành viên…" onRetry={retry} />
      </Box>
      {!isLoading && !error && data && (
        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <Typography color="text.secondary" variant="body2">{data.totalItems} thành viên</Typography>
          <FollowMemberList members={data.items} />
          <Pager label="Phân trang danh sách theo dõi" onChange={changePage} page={data.page} totalPages={data.totalPages} />
        </Stack>
      )}
    </PageShell>
  )
}
