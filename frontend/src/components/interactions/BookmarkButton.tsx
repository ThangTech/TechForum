import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { addBookmark, getBookmarkStatus, removeBookmark, type BookmarkStatus } from '../../api/bookmarks'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/authState'
import { AuthRequiredDialog } from '../AuthRequiredDialog'

export const BookmarkButton = ({ topicId }: { topicId: number }) => {
  const { user } = useAuth()
  const [status, setStatus] = useState<BookmarkStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try { setStatus(await getBookmarkStatus(topicId, controller.signal)) }
      catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải số lượt lưu.')
      } finally { if (!controller.signal.aborted) setIsLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [retry, topicId, user?.id])

  const toggle = async () => {
    if (!user) { setIsAuthDialogOpen(true); return }
    if (!status || isSaving) return
    setIsSaving(true)
    setError(null)
    try { setStatus(status.hasBookmark ? await removeBookmark(topicId) : await addBookmark(topicId)) }
    catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) setIsAuthDialogOpen(true)
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật bài đã lưu.')
    } finally { setIsSaving(false) }
  }

  return (
    <div>
      <Button
        isDisabled={isLoading || !status || isSaving}
        isLoading={isLoading || isSaving}
        label={status?.hasBookmark ? `Bỏ lưu · ${status.count}` : `Lưu bài · ${status?.count ?? 0}`}
        onClick={() => void toggle()}
        variant={status?.hasBookmark ? 'primary' : 'secondary'}
      />
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error} <button className="font-bold underline" onClick={() => setRetry((value) => value + 1)} type="button">Thử lại</button></p>}
      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}
