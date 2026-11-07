import Button from '@mui/material/Button'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AdminTopic, ModerationAction, TopicVisibility } from '../api/adminTopics'
import { ApiError } from '../api/client'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicModerationCard } from '../components/admin/TopicModerationCard'
import { AdminPagination } from '../components/admin/AdminPagination'
import { TopicPreviewDialog } from '../components/admin/TopicPreviewDialog'
import { TopicModerationDialog } from '../components/admin/TopicModerationDialog'
import { useAdminTopics, useModerateTopic } from '../queries/admin'
import { useCategories } from '../queries/categories'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

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
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ topic: AdminTopic; action: ModerationAction } | null>(null)

  const topicsQuery = useAdminTopics({ keyword, type, visibility, categoryId, page, pageSize: PAGE_SIZE })
  const categoriesQuery = useCategories()
  const moderateMutation = useModerateTopic()
  const data = topicsQuery.data ?? null
  const categories = categoriesQuery.data ?? []
  const isLoading = isInitialLoading(topicsQuery) || isInitialLoading(categoriesQuery)
  const error = getErrorMessage(topicsQuery.error, 'Không thể tải nội dung kiểm duyệt.') ??
    getErrorMessage(categoriesQuery.error, 'Không thể tải nội dung kiểm duyệt.')
  const isSaving = moderateMutation.isPending

  const retry = () => {
    if (topicsQuery.error) void topicsQuery.refetch()
    if (categoriesQuery.error) void categoriesQuery.refetch()
  }

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
    setActionError(null)
    setSuccess(null)
    try {
      // The list loads again after the change.
      await moderateMutation.mutateAsync({
        topicId: selected.topic.id,
        action: selected.action,
        reason,
        categoryId,
      })
      setSuccess('Đã cập nhật trạng thái nội dung và ghi nhật ký quản trị.')
      setSelected(null)
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể kiểm duyệt nội dung.',
      )
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
          <Button onClick={() => setParams({})} variant="text">Xóa lọc</Button>
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
            onRetry={retry}
          />
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              Không có nội dung phù hợp.
            </div>
          )}
          {!isLoading && !error && data && data.items.length > 0 && (
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
                      onAction={(action) => {
                        setActionError(null)
                        setSelected({ topic, action })
                      }}
                      onPreview={() => setPreviewId(topic.id)}
                      topic={topic}
                    />
                  ))}
                </TableBody>
              </Table>
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
