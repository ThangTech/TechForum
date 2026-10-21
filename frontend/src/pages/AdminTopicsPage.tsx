import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminTopics,
  moderateTopic,
  type AdminTopic,
  type AdminTopicPage,
  type ModerationAction,
  type TopicVisibility,
} from '../api/adminTopics'
import { getCategories, type Category } from '../api/categories'
import { ApiError } from '../api/client'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicModerationCard } from '../components/admin/TopicModerationCard'
import { AdminPagination } from '../components/admin/AdminPagination'
import { TopicPreviewDialog } from '../components/admin/TopicPreviewDialog'
import { TopicModerationDialog } from '../components/admin/TopicModerationDialog'

const PAGE_SIZE = 10
const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
const readVisibility = (value: string | null): TopicVisibility =>
  value === 'visible' || value === 'draft' || value === 'hidden' || value === 'deleted' ? value : ''

export const AdminTopicsPage = () => {
  const [params, setParams] = useSearchParams()
  const page = readPage(params.get('page'))
  const keyword = params.get('keyword')?.trim() ?? ''
  const type =
    params.get('type') === 'article' || params.get('type') === 'question'
      ? (params.get('type') as 'article' | 'question')
      : ''
  const visibility = readVisibility(params.get('visibility'))
  const categoryValue = Number(params.get('categoryId'))
  const categoryId = Number.isInteger(categoryValue) && categoryValue > 0 ? categoryValue : undefined
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [data, setData] = useState<AdminTopicPage | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ topic: AdminTopic; action: ModerationAction } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [topics, categoryItems] = await Promise.all([
          getAdminTopics(
            { keyword, type, visibility, categoryId, page, pageSize: PAGE_SIZE },
            controller.signal,
          ),
          getCategories(controller.signal),
        ])
        setData(topics)
        setCategories(categoryItems)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(
          requestError instanceof ApiError ? requestError.message : 'Không thể tải nội dung kiểm duyệt.',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [keyword, page, retry, type, visibility, categoryId])

  const update = (changes: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (resetPage) next.delete('page')
    setParams(next)
  }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    update({
      keyword: String(fields.get('keyword') ?? '').trim(),
      type: String(fields.get('type') ?? ''),
      visibility: String(fields.get('visibility') ?? ''),
      categoryId: String(fields.get('categoryId') ?? ''),
    })
  }
  const apply = async (reason: string, categoryId?: number) => {
    if (!selected || isSaving) return
    setIsSaving(true)
    setActionError(null)
    setSuccess(null)
    try {
      await moderateTopic(selected.topic.id, selected.action, reason, categoryId)
      setRetry((value) => value + 1)
      setSuccess('Đã cập nhật trạng thái nội dung và ghi nhật ký quản trị.')
      setSelected(null)
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể kiểm duyệt nội dung.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="admin-page">
      <div>
        <p className="eyebrow">Quản trị nội dung</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Kiểm duyệt nội dung</h1>
        <p className="admin-page-description mt-2">
          Xem trước nội dung và ghi lý do cho mỗi thao tác kiểm duyệt.
        </p>
        <form
          className="admin-toolbar"
          key={`${keyword}-${type}-${visibility}-${categoryId ?? ''}`}
          onSubmit={submitSearch}
        >
          <label className="admin-field admin-search-field">
            Tìm nội dung
            <input defaultValue={keyword} maxLength={100} name="keyword" placeholder="Tìm theo tiêu đề" />
          </label>
          <label className="admin-field">
            Loại nội dung
            <select defaultValue={type} name="type">
              <option value="">Tất cả loại</option>
              <option value="article">Bài viết</option>
              <option value="question">Câu hỏi</option>
            </select>
          </label>
          <label className="admin-field">
            Trạng thái
            <select defaultValue={visibility} name="visibility">
              <option value="">Tất cả trạng thái</option>
              <option value="visible">Công khai</option>
              <option value="draft">Bản nháp</option>
              <option value="hidden">Bị kiểm duyệt ẩn</option>
              <option value="deleted">Tác giả đã xóa</option>
            </select>
          </label>
          <label className="admin-field">
            Chuyên mục
            <select defaultValue={categoryId ?? ''} name="categoryId">
              <option value="">Tất cả chuyên mục</option>
              {categoryId && !categories.some((category) => category.id === categoryId) && (
                <option value={categoryId}>Chuyên mục #{categoryId}</option>
              )}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Button label="Lọc nội dung" type="submit" variant="primary" />
          <button className="admin-text-button min-h-10" onClick={() => setParams({})} type="button">
            Xóa lọc
          </button>
        </form>
        {actionError && !selected && (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </p>
        )}
        {success && (
          <p
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            role="status"
          >
            {success}
          </p>
        )}
        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            onRetry={() => setRetry((value) => value + 1)}
          />
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có nội dung phù hợp.
            </div>
          )}
          {!isLoading && !error && data && data.items.length > 0 && (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <caption className="sr-only">Danh sách nội dung kiểm duyệt</caption>
                <thead>
                  <tr>
                    <th>Nội dung / Chuyên mục</th>
                    <th>Loại</th>
                    <th>Tác giả</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((topic) => (
                    <TopicModerationCard
                      key={topic.id}
                      onAction={(action) => {
                        setActionError(null)
                        setSelected({ topic, action })
                      }}
                      onPreview={() => setPreviewId(topic.id)}
                      topic={topic}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !error && data && (
            <AdminPagination {...data} onChange={(nextPage) => update({ page: String(nextPage) }, false)} />
          )}
        </div>
      </div>
      {previewId !== null && (
        <TopicPreviewDialog key={previewId} onClose={() => setPreviewId(null)} topicId={previewId} />
      )}
      {selected && (
        <TopicModerationDialog
          action={selected.action}
          categories={categories.filter((category) => category.id !== selected.topic.category.id)}
          isBusy={isSaving}
          onClose={() => {
            setActionError(null)
            setSelected(null)
          }}
          onConfirm={(reason, categoryId) => void apply(reason, categoryId)}
          requestError={actionError}
        />
      )}
    </section>
  )
}
