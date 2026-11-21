import Box from '@mui/material/Box'
import { useSearchParams } from 'react-router-dom'
import { ActivityList } from '../components/ActivityList'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { useMyActivity } from '../hooks/activity'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { usePageParam } from '../../../shared/hooks/usePageParam'

export const ActivityPage = () => {
  const [, setSearchParams] = useSearchParams()
  const page = usePageParam()
  const activityQuery = useMyActivity(page, 20)
  const data = activityQuery.data ?? null
  const isLoading = isInitialLoading(activityQuery)
  const error = getErrorMessage(activityQuery.error, 'Không thể tải lịch sử hoạt động.')

  const reload = () => void activityQuery.refetch()
  const changePage = (next: number) => setSearchParams(next <= 1 ? {} : { page: String(next) })

  return (
    <PageShell compact maxWidth={1240}>
      <Box sx={{ mb: 3 }}>
        <PageHeading
          description="Các bài viết, câu hỏi và câu trả lời công khai của bạn."
          eyebrow="Tài khoản cá nhân"
          size="medium"
          title="Lịch sử hoạt động"
        />
      </Box>
      <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải lịch sử…" onRetry={reload} />
      {!isLoading && !error && data && <ActivityList data={data} onPageChange={changePage} />}
    </PageShell>
  )
}
