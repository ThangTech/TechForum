import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteTopic, getMyTopics, type OwnTopicPage, type TopicType } from '../api/topics'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog'
import { OwnTopicFilters } from '../components/topics/OwnTopicFilters'
import { OwnTopicList } from '../components/topics/OwnTopicList'
import { appRoutes } from '../appRoutes'

const readPositiveInteger = (value: string | null) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const readTopicType = (value: string | null): TopicType | undefined =>
  value === 'article' || value === 'question' ? value : undefined

export const MyTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPositiveInteger(searchParams.get('page'))
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const type = readTopicType(searchParams.get('type'))
  const [data, setData] = useState<OwnTopicPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const loadTopics = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(await getMyTopics({
          page,
          pageSize: 10,
          keyword: keyword || undefined,
          type: type === 'article' ? 'Article' : type === 'question' ? 'Question' : undefined,
        }, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải nội dung của bạn.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadTopics()
    return () => controller.abort()
  }, [page, keyword, type, requestVersion])

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next)
  }

  const confirmDelete = async () => {
    if (deletingId === null || isDeleting) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteTopic(deletingId)
      setDeletingId(null)
      setRequestVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xóa nội dung.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Không gian cá nhân</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Nội dung của tôi</h1>
            <p className="mt-3 text-sm text-slate-600">Quản lý bản nháp và theo dõi trạng thái nội dung đã xuất bản.</p>
          </div>
          <Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white" to={appRoutes.write}>Viết nội dung</Link>
        </div>

        <div className="mt-6">
          <OwnTopicFilters
            key={`${keyword}-${type ?? 'all'}`}
            initialKeyword={keyword}
            initialType={type}
            onApply={(nextKeyword, nextType) => updateParams({ keyword: nextKeyword || undefined, type: nextType, page: undefined })}
          />
        </div>

        <div className="mt-6">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung của bạn…"
            onRetry={() => setRequestVersion((version) => version + 1)}
          />
          {!isLoading && !error && data && (
            <OwnTopicList
              data={data}
              onDelete={setDeletingId}
              onPageChange={(nextPage) => updateParams({ page: nextPage <= 1 ? undefined : nextPage })}
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel="Xóa nội dung"
        description="Nội dung chưa có câu trả lời sẽ được xóa mềm và không còn xuất hiện công khai. Nội dung đã có đóng góp cộng đồng không thể tự xóa; bạn cần liên hệ quản trị viên khi cần xử lý."
        isBusy={isDeleting}
        isOpen={deletingId !== null}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
        title="Xóa nội dung này?"
      />
    </main>
  )
}
