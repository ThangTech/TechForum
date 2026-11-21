import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { AdminPagination } from '../components/AdminPagination'
import { TopicModerationCard } from '../components/TopicModerationCard'
import { TopicModerationDialog } from '../components/TopicModerationDialog'
import { TopicPreviewDialog } from '../components/TopicPreviewDialog'
import { useAdminTopicsPage } from '../hooks/useAdminTopicsPage'

export const AdminTopicsPage = () => {
  const view = useAdminTopicsPage()
  const { categories, data, filters, moderation, preview } = view
  const { keyword, type, visibility, categoryId } = filters
  const isReady = !view.isLoading && !view.error

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          description="Xem trước nội dung và ghi lý do cho mỗi thao tác kiểm duyệt."
          eyebrow="Quản trị nội dung"
          title="Kiểm duyệt nội dung"
        />
        <form
          className="admin-toolbar"
          key={`${keyword}-${type}-${visibility}-${categoryId ?? ''}`}
          onSubmit={view.submitFilters}
        >
          <TextField size="small" label="Tìm nội dung" defaultValue={keyword} name="keyword" placeholder="Tìm theo tiêu đề" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
          <TextField size="small" label="Loại nội dung" defaultValue={type} name="type" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
              <option value="">Tất cả loại</option>
              <option value="article">Bài viết</option>
              <option value="question">Câu hỏi</option>
            </TextField>
          <TextField size="small" label="Trạng thái" defaultValue={visibility} name="visibility" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
              <option value="">Tất cả trạng thái</option>
              <option value="visible">Công khai</option>
              <option value="draft">Bản nháp</option>
              <option value="hidden">Bị kiểm duyệt ẩn</option>
              <option value="deleted">Tác giả đã xóa</option>
            </TextField>
          <TextField size="small" label="Chuyên mục" defaultValue={categoryId ?? ''} name="categoryId" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
              <option value="">Tất cả chuyên mục</option>
              {categoryId && !categories.some((category) => category.id === categoryId) && (
                <option value={categoryId}>Chuyên mục #{categoryId}</option>
              )}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </TextField>
          <Button type="submit" variant="contained">Lọc nội dung</Button>
          <Button onClick={view.clearFilters} variant="text">Xóa lọc</Button>
        </form>
        <AdminFeedback error={view.feedback.error} success={view.feedback.success} />
        <div>
          <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải nội dung…" onRetry={view.retry} />
          {isReady && data?.items.length === 0 && (
            <AdminEmptyState>Không có nội dung phù hợp.</AdminEmptyState>
          )}
          {isReady && data && data.items.length > 0 && (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách nội dung kiểm duyệt</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Nội dung / Chuyên mục</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Tác giả</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày đăng</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((topic) => (
                    <TopicModerationCard
                      key={topic.id}
                      onAction={(action) => moderation.choose(topic, action)}
                      onPreview={() => preview.open(topic.id)}
                      topic={topic}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {isReady && data && (
            <AdminPagination {...data} onChange={view.changePage} />
          )}
        </div>
      </div>
      {preview.topicId !== null && (
        <TopicPreviewDialog key={preview.topicId} onClose={preview.close} topicId={preview.topicId} />
      )}
      {moderation.selected && (
        <TopicModerationDialog
          action={moderation.selected.action}
          categories={categories.filter((category) => category.id !== moderation.selected?.topic.category.id)}
          isBusy={moderation.isBusy}
          onClose={moderation.close}
          onConfirm={(reason, newCategoryId) => void moderation.confirm(reason, newCategoryId)}
          requestError={moderation.error}
        />
      )}
    </section>
  )
}
