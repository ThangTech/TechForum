import Box from '@mui/material/Box'
import { ActivityList } from '../components/ActivityList'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { useActivityPage } from '../hooks/useActivityPage'

export const ActivityPage = () => {
  const { data, isLoading, error, reload, changePage } = useActivityPage()

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
