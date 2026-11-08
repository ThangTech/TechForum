import Box from '@mui/material/Box'
import { useSearchParams } from 'react-router-dom'
import { ActivityList } from '../components/account/ActivityList'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
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
