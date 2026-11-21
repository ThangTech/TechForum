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
import { CategoryAdminCard } from '../components/CategoryAdminCard'
import { CategoryFormDialog } from '../components/CategoryFormDialog'
import { CATEGORY_FILTER_KEYS, useAdminCategoriesPage } from '../hooks/useAdminCategoriesPage'

export const AdminCategoriesPage = () => {
  const view = useAdminCategoriesPage()
  const { filters, form } = view
  const isReady = !view.isLoading && !view.error

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          actions={<Button onClick={() => form.open(null)} variant="contained">Tạo chuyên mục</Button>}
          description="Chuyên mục ngừng sử dụng vẫn được giữ cho các chủ đề cũ."
          eyebrow="Quản trị phân loại"
          title="Chuyên mục"
        />

        <form
          className="admin-toolbar"
          key={`${filters.keyword}-${filters.status}`}
          onSubmit={(event) => view.submitFilters(event, CATEGORY_FILTER_KEYS)}
          role="search"
        >
          <TextField size="small" label="Tìm kiếm" defaultValue={filters.keyword} name="keyword" placeholder="Tìm theo tên hoặc đường dẫn" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
          <TextField size="small" label="Trạng thái" defaultValue={filters.status} name="status" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang sử dụng</option>
            <option value="inactive">Đã ngừng sử dụng</option>
          </TextField>
          <Button type="submit" variant="outlined">Lọc danh sách</Button>
          <Button onClick={view.clearFilters} variant="text">Xóa lọc</Button>
        </form>

        <AdminFeedback error={view.feedback.error} success={view.feedback.success} />

        <div>
          <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải chuyên mục…" onRetry={view.retry} />
          {isReady && view.totalItems === 0 && <AdminEmptyState>Không có chuyên mục phù hợp.</AdminEmptyState>}
          {isReady && view.totalItems > 0 && (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách chuyên mục</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Chuyên mục</TableCell>
                    <TableCell>Thứ tự</TableCell>
                    <TableCell>Chủ đề</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {view.items.map((category) => (
                    <CategoryAdminCard
                      busyId={view.busyId}
                      category={category}
                      key={category.id}
                      onEdit={form.open}
                      onToggleActive={(item) => void view.toggleActive(item)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {isReady && (
            <AdminPagination
              onChange={view.changePage}
              page={view.page}
              pageSize={view.pageSize}
              totalItems={view.totalItems}
              totalPages={view.totalPages}
            />
          )}
        </div>
      </div>

      {form.isOpen && (
        <CategoryFormDialog
          category={form.editing}
          isBusy={form.isSaving}
          onClose={form.close}
          onSubmit={(input) => void form.save(input)}
          requestError={form.error}
        />
      )}
    </section>
  )
}
