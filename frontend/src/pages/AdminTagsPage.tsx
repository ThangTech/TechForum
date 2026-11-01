import Button from '@mui/material/Button'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createAdminTag,
  getAdminTags,
  setAdminTagActive,
  updateAdminTag,
  type AdminTag,
  type SaveTagInput,
} from '../api/adminTags'
import { useSearchParams } from 'react-router-dom'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ApiError } from '../api/client'
import { TagAdminCard } from '../components/admin/TagAdminCard'
import { TagFormDialog } from '../components/admin/TagFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
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

  const [tags, setTags] = useState<AdminTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminTag | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setTags(await getAdminTags(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách thẻ.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [retry])

  const openForm = (tag: AdminTag | null) => {
    setEditing(tag)
    setActionError(null)
    setIsFormOpen(true)
  }

  const save = async (input: SaveTagInput) => {
    if (isSaving) return
    setIsSaving(true)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const saved = editing ? await updateAdminTag(editing.id, input) : await createAdminTag(input)
      setTags((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
      )
      setSuccessMessage(editing ? 'Đã cập nhật thẻ.' : 'Đã tạo thẻ.')
      setIsFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu thẻ.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (tag: AdminTag) => {
    if (busyId !== null) return
    setBusyId(tag.id)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await setAdminTagActive(tag.id, !tag.isActive)
      setTags((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSuccessMessage(
        updated.isActive ? 'Thẻ đã được sử dụng lại.' : 'Thẻ đã ngừng sử dụng cho nội dung mới.',
      )
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái thẻ.',
      )
    } finally {
      setBusyId(null)
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Quản trị phân loại</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Thẻ công nghệ</h1>
            <p className="mt-2 text-slate-600">Thẻ ngừng sử dụng vẫn được giữ trên các chủ đề cũ.</p>
          </div>
          <Button onClick={() => openForm(null)} variant="contained">Tạo thẻ</Button>
        </div>

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

        {actionError && !isFormOpen && (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </p>
        )}
        {successMessage && (
          <p
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải thẻ…"
            onRetry={() => setRetry((value) => value + 1)}
          />
          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có thẻ phù hợp.
            </div>
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
