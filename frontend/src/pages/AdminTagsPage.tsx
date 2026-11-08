import Button from '@mui/material/Button'
import { useState, type FormEvent } from 'react'
import type { AdminTag, SaveTagInput } from '../api/adminTags'
import { useSearchParams } from 'react-router-dom'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ApiError } from '../api/client'
import { TagAdminCard } from '../components/admin/TagAdminCard'
import { TagFormDialog } from '../components/admin/TagFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { AdminEmptyState } from '../components/admin/AdminEmptyState'
import { AdminFeedback } from '../components/admin/AdminFeedback'
import { AdminPageHeading } from '../components/admin/AdminPageHeading'
import { useAdminTags, useSaveAdminTag, useToggleAdminTag } from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export const AdminTagsPage = () => {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword')?.trim() ?? ''
  const status = params.get('status') ?? ''
  const pageValue = Number(params.get('page'))
  const requestedPage = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1

  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminTag | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const tagsQuery = useAdminTags()
  const saveMutation = useSaveAdminTag(editing?.id ?? null)
  const toggleMutation = useToggleAdminTag()
  const tags = tagsQuery.data ?? []
  const isLoading = isInitialLoading(tagsQuery)
  const error = getErrorMessage(tagsQuery.error, 'Không thể tải danh sách thẻ.')
  const isSaving = saveMutation.isPending
  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const openForm = (tag: AdminTag | null) => {
    setEditing(tag)
    setActionError(null)
    setIsFormOpen(true)
  }

  const save = async (input: SaveTagInput) => {
    if (isSaving) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      // The list loads again after the save.
      await saveMutation.mutateAsync(input)
      setSuccessMessage(editing ? 'Đã cập nhật thẻ.' : 'Đã tạo thẻ.')
      setIsFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu thẻ.')
    }
  }

  const toggleActive = async (tag: AdminTag) => {
    if (busyId !== null) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await toggleMutation.mutateAsync(tag)
      setSuccessMessage(
        updated.isActive ? 'Thẻ đã được sử dụng lại.' : 'Thẻ đã ngừng sử dụng cho nội dung mới.',
      )
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái thẻ.',
      )
    }
  }

  const filtered = tags.filter(
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
          actions={<Button onClick={() => openForm(null)} variant="contained">Tạo thẻ</Button>}
          description="Thẻ ngừng sử dụng vẫn được giữ trên các chủ đề cũ."
          eyebrow="Quản trị phân loại"
          title="Thẻ công nghệ"
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
            loadingText="Đang tải thẻ…"
            onRetry={() => void tagsQuery.refetch()}
          />
          {!isLoading && !error && filtered.length === 0 && (
            <AdminEmptyState>Không có thẻ phù hợp.</AdminEmptyState>
          )}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách thẻ công nghệ</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Thẻ công nghệ</TableCell>
                    <TableCell>Chủ đề</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayed.map((tag) => (
                    <TagAdminCard
                      busyId={busyId}
                      key={tag.id}
                      onEdit={openForm}
                      onToggleActive={(item) => void toggleActive(item)}
                      tag={tag}
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
        <TagFormDialog
          isBusy={isSaving}
          onClose={() => {
            setActionError(null)
            setIsFormOpen(false)
          }}
          onSubmit={(input) => void save(input)}
          requestError={actionError}
          tag={editing}
        />
      )}
    </section>
  )
}
