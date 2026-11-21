import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../../../shared/feedback/ConfirmDialog'
import { OwnTopicFilters } from '../components/OwnTopicFilters'
import { OwnTopicList } from '../components/OwnTopicList'
import { appRoutes } from '../../../app/appRoutes'
import { useMyTopicsPage } from '../hooks/useMyTopicsPage'

export const MyTopicsPage = () => {
  const view = useMyTopicsPage()
  const { data, filters, removal } = view

  return (
    <PageShell>
      <PageHeading
        actions={<Button component={Link} to={appRoutes.write} variant="contained">Viết nội dung</Button>}
        description="Quản lý bản nháp và theo dõi trạng thái nội dung đã xuất bản."
        eyebrow="Không gian cá nhân"
        title="Nội dung của tôi"
      />

      <Box sx={{ mt: 3 }}>
        <OwnTopicFilters
          key={`${filters.keyword}-${filters.type ?? 'all'}`}
          initialKeyword={filters.keyword}
          initialType={filters.type}
          onApply={view.applyFilters}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <AsyncStatePanel
          error={view.error}
          isLoading={view.isLoading}
          loadingText="Đang tải nội dung của bạn…"
          onRetry={view.retry}
        />
        {!view.isLoading && !view.error && data && (
          <OwnTopicList
            data={data}
            onDelete={removal.ask}
            onPageChange={view.changePage}
          />
        )}
      </Box>
      <ConfirmDialog
        confirmLabel="Xóa nội dung"
        description="Nội dung chưa có câu trả lời sẽ được xóa mềm và không còn xuất hiện công khai. Nội dung đã có đóng góp cộng đồng không thể tự xóa; bạn cần liên hệ quản trị viên khi cần xử lý."
        isBusy={removal.isBusy}
        isOpen={removal.isOpen}
        onCancel={removal.cancel}
        onConfirm={() => void removal.confirm()}
        title="Xóa nội dung này?"
      />
    </PageShell>
  )
}
