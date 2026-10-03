import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { createAdminCategory, getAdminCategories, setAdminCategoryActive, updateAdminCategory, type AdminCategory, type SaveCategoryInput } from '../api/adminCategories'
import { ApiError } from '../api/client'
import { CategoryAdminCard } from '../components/admin/CategoryAdminCard'
import { CategoryFormDialog } from '../components/admin/CategoryFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

export const AdminCategoriesPage = () => {
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
      const saved = editing
        ? await updateAdminCategory(editing.id, input)
        : await createAdminCategory(input)
      setCategories((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, 'vi')))
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
      setCategories((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSuccessMessage(updated.isActive ? 'Chuyên mục đã được sử dụng lại.' : 'Chuyên mục đã ngừng sử dụng cho nội dung mới.')
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái chuyên mục.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Quản trị phân loại</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Chuyên mục</h1>
            <p className="mt-2 text-slate-600">Chuyên mục ngừng sử dụng vẫn được giữ cho các chủ đề cũ.</p>
          </div>
          <Button label="Tạo chuyên mục" onClick={openCreate} variant="primary" />
        </div>

        {actionError && !isFormOpen && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
        {successMessage && <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{successMessage}</p>}

        <div className="mt-6">
          <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải chuyên mục…" onRetry={() => setRetry((value) => value + 1)} />
          {!isLoading && !error && categories.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">Chưa có chuyên mục nào.</div>
          )}
          {!isLoading && !error && categories.length > 0 && (
            <div className="grid gap-4">
              {categories.map((category) => (
                <CategoryAdminCard busyId={busyId} category={category} key={category.id} onEdit={openEdit} onToggleActive={(item) => void toggleActive(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <CategoryFormDialog
          category={editing}
          isBusy={isSaving}
          onClose={() => { setActionError(null); setIsFormOpen(false) }}
          onSubmit={(input) => void save(input)}
          requestError={actionError}
        />
      )}
    </main>
  )
}
