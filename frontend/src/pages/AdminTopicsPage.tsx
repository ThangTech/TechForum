import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminTopics, moderateTopic, type AdminTopic, type AdminTopicPage, type ModerationAction, type TopicVisibility } from '../api/adminTopics'
import { getCategories, type Category } from '../api/categories'
import { ApiError } from '../api/client'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicModerationCard } from '../components/admin/TopicModerationCard'
import { TopicModerationDialog } from '../components/admin/TopicModerationDialog'

const PAGE_SIZE = 10
const readPage = (value: string | null) => { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1 }
const readVisibility = (value: string | null): TopicVisibility => value === 'visible' || value === 'hidden' || value === 'deleted' ? value : ''

export const AdminTopicsPage = () => {
  const [params, setParams] = useSearchParams()
  const page = readPage(params.get('page'))
  const keyword = params.get('keyword')?.trim() ?? ''
  const type = params.get('type') === 'article' || params.get('type') === 'question' ? params.get('type') as 'article' | 'question' : ''
  const visibility = readVisibility(params.get('visibility'))
  const [searchText, setSearchText] = useState(keyword)
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
      setIsLoading(true); setError(null)
      try {
        const [topics, categoryItems] = await Promise.all([
          getAdminTopics({ keyword, type, visibility, page, pageSize: PAGE_SIZE }, controller.signal),
          getCategories(controller.signal),
        ])
        setData(topics); setCategories(categoryItems)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải nội dung kiểm duyệt.')
      } finally { if (!controller.signal.aborted) setIsLoading(false) }
    }
    void load(); return () => controller.abort()
  }, [keyword, page, retry, type, visibility])

  const update = (changes: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    if (resetPage) next.delete('page')
    setParams(next)
  }
  const submitSearch = (event: FormEvent) => { event.preventDefault(); update({ keyword: searchText.trim() }) }
  const apply = async (reason: string, categoryId?: number) => {
    if (!selected || isSaving) return
    setIsSaving(true); setActionError(null); setSuccess(null)
    try {
      const updated = await moderateTopic(selected.topic.id, selected.action, reason, categoryId)
      setData((current) => current ? { ...current, items: current.items.map((item) => item.id === updated.id ? updated : item) } : current)
      setSuccess('Đã cập nhật trạng thái nội dung và ghi nhật ký quản trị.'); setSelected(null)
    } catch (requestError) { setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể kiểm duyệt nội dung.') }
    finally { setIsSaving(false) }
  }

  return (
    <main className="main-area" id="main-content"><div className="page-content py-10 sm:py-14">
      <p className="eyebrow">Quản trị nội dung</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">Kiểm duyệt nội dung</h1>
      <form className="mt-6 flex flex-wrap gap-3" onSubmit={submitSearch}>
        <input className="min-w-52 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5" maxLength={100} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm tiêu đề" value={searchText} />
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" onChange={(event) => update({ type: event.target.value })} value={type}><option value="">Mọi loại</option><option value="article">Bài viết</option><option value="question">Câu hỏi</option></select>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" onChange={(event) => update({ visibility: event.target.value })} value={visibility}><option value="">Mọi trạng thái</option><option value="visible">Đang hiển thị</option><option value="hidden">Bị kiểm duyệt ẩn</option><option value="deleted">Tác giả đã xóa</option></select>
        <Button label="Tìm kiếm" type="submit" variant="primary" />
      </form>
      {actionError && !selected && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
      {success && <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{success}</p>}
      <div className="mt-6"><AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải nội dung…" onRetry={() => setRetry((value) => value + 1)} />
        {!isLoading && !error && data?.items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">Không có nội dung phù hợp.</div>}
        {!isLoading && !error && data && data.items.length > 0 && <><div className="grid gap-4">{data.items.map((topic) => <TopicModerationCard key={topic.id} onAction={(action) => { setActionError(null); setSelected({ topic, action }) }} topic={topic} />)}</div>
          {data.totalPages > 1 && <nav className="mt-6 flex items-center justify-between"><Button isDisabled={page <= 1} label="Trang trước" onClick={() => update({ page: String(page - 1) }, false)} variant="secondary" /><span className="text-sm text-slate-600">Trang {page}/{data.totalPages}</span><Button isDisabled={page >= data.totalPages} label="Trang sau" onClick={() => update({ page: String(page + 1) }, false)} variant="secondary" /></nav>}</>}
      </div>
    </div>
    {selected && <TopicModerationDialog action={selected.action} categories={categories.filter((category) => category.id !== selected.topic.category.id)} isBusy={isSaving} onClose={() => { setActionError(null); setSelected(null) }} onConfirm={(reason, categoryId) => void apply(reason, categoryId)} requestError={actionError} />}
    </main>
  )
}
