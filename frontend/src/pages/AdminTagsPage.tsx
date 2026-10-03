import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { createAdminTag, getAdminTags, setAdminTagActive, updateAdminTag, type AdminTag, type SaveTagInput } from '../api/adminTags'
import { ApiError } from '../api/client'
import { TagAdminCard } from '../components/admin/TagAdminCard'
import { TagFormDialog } from '../components/admin/TagFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

export const AdminTagsPage = () => {
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
      setTags((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((left, right) => left.name.localeCompare(right.name, 'vi')))
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
      setTags((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSuccessMessage(updated.isActive ? 'Thẻ đã được sử dụng lại.' : 'Thẻ đã ngừng sử dụng cho nội dung mới.')
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái thẻ.')
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
            <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Thẻ công nghệ</h1>
            <p className="mt-2 text-slate-600">Thẻ ngừng sử dụng vẫn được giữ trên các chủ đề cũ.</p>
          </div>
          <Button label="Tạo thẻ" onClick={() => openForm(null)} variant="primary" />
        </div>

        {actionError && !isFormOpen && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
        {successMessage && <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{successMessage}</p>}

        <div className="mt-6">
          <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải thẻ…" onRetry={() => setRetry((value) => value + 1)} />
          {!isLoading && !error && tags.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">Chưa có thẻ nào.</div>}
          {!isLoading && !error && tags.length > 0 && (
            <div className="grid gap-4">
              {tags.map((tag) => <TagAdminCard busyId={busyId} key={tag.id} onEdit={openForm} onToggleActive={(item) => void toggleActive(item)} tag={tag} />)}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <TagFormDialog
          isBusy={isSaving}
          onClose={() => { setActionError(null); setIsFormOpen(false) }}
          onSubmit={(input) => void save(input)}
          requestError={actionError}
          tag={editing}
        />
      )}
    </main>
  )
}
