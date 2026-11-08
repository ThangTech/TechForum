import Button from '@mui/material/Button'
import { useState, type FormEvent } from 'react'
import type { AdminCategory, SaveCategoryInput } from '../api/adminCategories'
import { useSearchParams } from 'react-router-dom'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ApiError } from '../api/client'
import { CategoryAdminCard } from '../components/admin/CategoryAdminCard'
import { CategoryFormDialog } from '../components/admin/CategoryFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/admin/AdminEmptyState'
import { AdminFeedback } from '../components/admin/AdminFeedback'
import { AdminPageHeading } from '../components/admin/AdminPageHeading'
import { useAdminCategories, useSaveAdminCategory, useToggleAdminCategory } from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export const AdminCategoriesPage = () => {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword')?.trim() ?? ''
  const status = params.get('status') ?? ''
  const pageValue = Number(params.get('page'))
  const requestedPage = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1

  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const categoriesQuery = useAdminCategories()
  const saveMutation = useSaveAdminCategory(editing?.id ?? null)
  const toggleMutation = useToggleAdminCategory()
  const categories = categoriesQuery.data ?? []
  const isLoading = isInitialLoading(categoriesQuery)
  const error = getErrorMessage(categoriesQuery.error, 'Không thể tải chuyên mục.')
  const isSaving = saveMutation.isPending
  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const openCreate = () => {
    setEditing(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  const openEdit = (category: AdminCategory) => {
    setEditing(category)
    setActionError(null)
    setIsFormOpen(true)
  }

  const save = async (input: SaveCategoryInput) => {
    if (isSaving) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      // The list loads again after the save.
      await saveMutation.mutateAsync(input)
      setSuccessMessage(editing ? 'Đã cập nhật chuyên mục.' : 'Đã tạo chuyên mục.')
      setIsFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu chuyên mục.')
    }
  }

  const toggleActive = async (category: AdminCategory) => {
    if (busyId !== null) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await toggleMutation.mutateAsync(category)
      setSuccessMessage(
        updated.isActive
          ? 'Chuyên mục đã được sử dụng lại.'
          : 'Chuyên mục đã ngừng sử dụng cho nội dung mới.',
      )
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái chuyên mục.',
      )
    }
  }

  const filtered = categories.filter(
    (value) =>
      (!keyword ||
        value.name.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')) ||
        value.slug.toLowerCase().includes(keyword.toLowerCase())) &&
      (status === 'active' ? value.isActive : status === 'inactive' ? !value.isActive : true),
  )
  const pageSize = 15
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.max(1, Math.min(requestedPage, totalPages))
  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize)
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['keyword', 'status']) {
      const value = String(values.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    setParams(next)
  }
  const changePage = (value: number) => {
    const next = new URLSearchParams(params)
    if (value > 1) next.set('page', String(value))
    else next.delete('page')
    setParams(next)
  }

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          actions={<Button onClick={openCreate} variant="contained">Tạo chuyên mục</Button>}
          description="Chuyên mục ngừng sử dụng vẫn được giữ cho các chủ đề cũ."
          eyebrow="Quản trị phân loại"
          title="Chuyên mục"
        />

        <form className="admin-toolbar" key={`${keyword}-${status}`} onSubmit={filter} role="search">
          <TextField size="small" label="Tìm kiếm" defaultValue={keyword} name="keyword" placeholder="Tìm theo tên hoặc đường dẫn" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
          <TextField size="small" label="Trạng thái" defaultValue={status} name="status" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Đã ngừng sử dụng</option>
            </TextField>
          <Button type="submit" variant="outlined">Lọc danh sách</Button>
          <Button onClick={() => setParams({})} variant="text">Xóa lọc</Button>
        </form>

        <AdminFeedback error={isFormOpen ? null : actionError} success={successMessage} />

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải chuyên mục…"
            onRetry={() => void categoriesQuery.refetch()}
          />
          {!isLoading && !error && filtered.length === 0 && (
            <AdminEmptyState>Không có chuyên mục phù hợp.</AdminEmptyState>
          )}
          {!isLoading && !error && filtered.length > 0 && (
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
                  {displayed.map((category) => (
                    <CategoryAdminCard
                      busyId={busyId}
                      category={category}
                      key={category.id}
                      onEdit={openEdit}
                      onToggleActive={(item) => void toggleActive(item)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && !error && (
            <AdminPagination
              onChange={changePage}
              page={page}
              pageSize={pageSize}
              totalItems={filtered.length}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>

      {isFormOpen && (
        <CategoryFormDialog
          category={editing}
          isBusy={isSaving}
          onClose={() => {
            setActionError(null)
            setIsFormOpen(false)
          }}
          onSubmit={(input) => void save(input)}
          requestError={actionError}
        />
      )}
    </section>
  )
}
