import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createAdminCategory,
  getAdminCategories,
  setAdminCategoryActive,
  updateAdminCategory,
  type AdminCategory,
  type SaveCategoryInput,
} from '../api/adminCategories'
import { useSearchParams } from 'react-router-dom'
import { AdminPagination } from '../components/admin/AdminPagination'
import { ApiError } from '../api/client'
import { CategoryAdminCard } from '../components/admin/CategoryAdminCard'
import { CategoryFormDialog } from '../components/admin/CategoryFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

export const AdminCategoriesPage = () => {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword')?.trim() ?? ''
  const status = params.get('status') ?? ''
  const pageValue = Number(params.get('page'))
  const requestedPage = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
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
        setCategories(await getAdminCategories(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải chuyên mục.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [retry])

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
    setIsSaving(true)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const saved = editing ? await updateAdminCategory(editing.id, input) : await createAdminCategory(input)
      setCategories((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved].sort(
              (left, right) =>
                left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, 'vi'),
            ),
      )
      setSuccessMessage(editing ? 'Đã cập nhật chuyên mục.' : 'Đã tạo chuyên mục.')
      setIsFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu chuyên mục.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (category: AdminCategory) => {
    if (busyId !== null) return
    setBusyId(category.id)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await setAdminCategoryActive(category.id, !category.isActive)
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSuccessMessage(
        updated.isActive
          ? 'Chuyên mục đã được sử dụng lại.'
          : 'Chuyên mục đã ngừng sử dụng cho nội dung mới.',
      )
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái chuyên mục.',
      )
    } finally {
      setBusyId(null)
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Quản trị phân loại</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Chuyên mục</h1>
            <p className="mt-2 text-slate-600">Chuyên mục ngừng sử dụng vẫn được giữ cho các chủ đề cũ.</p>
          </div>
          <Button label="Tạo chuyên mục" onClick={openCreate} variant="primary" />
        </div>

        <form className="admin-toolbar" key={`${keyword}-${status}`} onSubmit={filter} role="search">
          <label className="admin-field admin-search-field">
            Tìm kiếm
            <input
              defaultValue={keyword}
              maxLength={100}
              name="keyword"
              placeholder="Tìm theo tên hoặc đường dẫn"
            />
          </label>
          <label className="admin-field">
            Trạng thái
            <select defaultValue={status} name="status">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Đã ngừng sử dụng</option>
            </select>
          </label>
          <Button label="Lọc danh sách" type="submit" variant="secondary" />
          <button className="admin-text-button min-h-10" onClick={() => setParams({})} type="button">
            Xóa lọc
          </button>
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
            loadingText="Đang tải chuyên mục…"
            onRetry={() => setRetry((value) => value + 1)}
          />
          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có chuyên mục phù hợp.
            </div>
          )}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <caption className="sr-only">Danh sách chuyên mục</caption>
                <thead>
                  <tr>
                    <th>Chuyên mục</th>
                    <th>Thứ tự</th>
                    <th>Chủ đề</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((category) => (
                    <CategoryAdminCard
                      busyId={busyId}
                      category={category}
                      key={category.id}
                      onEdit={openEdit}
                      onToggleActive={(item) => void toggleActive(item)}
                    />
                  ))}
                </tbody>
              </table>
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
