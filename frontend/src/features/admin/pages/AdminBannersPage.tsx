import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../../../shared/feedback/ConfirmDialog'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { BannerAdminCard } from '../components/BannerAdminCard'
import { BannerFormDialog } from '../components/BannerFormDialog'
import { useAdminBannersPage } from '../hooks/useAdminBannersPage'

export const AdminBannersPage = () => {
  const view = useAdminBannersPage()
  const { form, removal } = view
  const isReady = !view.isLoading && !view.error

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          actions={<Button onClick={() => form.open(null)} variant="contained">Thêm banner</Button>}
          description="Các ảnh trượt ở đầu trang chủ. Banner chỉ hiện khi đang bật và nằm trong khoảng thời gian đã đặt."
          eyebrow="Quản trị giao diện"
          title="Banner trang chủ"
        />

        <AdminFeedback error={view.feedback.error} success={view.feedback.success} />

        <div>
          <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải banner…" onRetry={view.retry} />
          {isReady && view.banners.length === 0 && (
            <AdminEmptyState>Chưa có banner nào. Bấm "Thêm banner" để tạo banner đầu tiên.</AdminEmptyState>
          )}
          {isReady && view.banners.length > 0 && (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách banner trang chủ</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Ảnh</TableCell>
                    <TableCell>Tiêu đề / Liên kết</TableCell>
                    <TableCell>Thứ tự</TableCell>
                    <TableCell>Thời gian hiển thị</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {view.banners.map((banner) => (
                    <BannerAdminCard
                      banner={banner}
                      busyId={view.busyId}
                      key={banner.id}
                      onDelete={removal.ask}
                      onEdit={form.open}
                      onToggleActive={(item) => void view.toggleActive(item)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {form.isOpen && (
        <BannerFormDialog
          banner={form.editing}
          isBusy={form.isSaving}
          onClose={form.close}
          onSubmit={(input) => void form.save(input)}
          onUploadImage={form.uploadImage}
          requestError={form.error}
        />
      )}
      <ConfirmDialog
        confirmLabel="Xóa banner"
        description={`Banner "${removal.banner?.title ?? ''}" sẽ bị xóa cùng ảnh của nó. Việc này không hoàn tác được. Nếu chỉ muốn tạm ẩn, hãy dùng nút Tắt.`}
        isBusy={removal.isBusy}
        isOpen={removal.banner !== null}
        onCancel={removal.cancel}
        onConfirm={() => void removal.confirm()}
        title="Xóa banner này?"
      />
    </section>
  )
}
