import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { appRoutes } from '../../../app/appRoutes'
import { BackLink } from '../../../shared/components/BackLink'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { Pager } from '../../../shared/components/Pager'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { FollowMemberList } from '../components/FollowMemberList'
import { useFollowMembersPage } from '../hooks/useFollowMembersPage'

interface FollowMembersPageProps {
  kind: 'followers' | 'following'
}

export const FollowMembersPage = ({ kind }: FollowMembersPageProps) => {
  const { userId, title, data, isLoading, error, retry, changePage } = useFollowMembersPage(kind)

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
