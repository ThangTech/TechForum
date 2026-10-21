import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminTopicDetail, type AdminTopic } from '../../api/adminTopics'
import { ApiError } from '../../api/client'
import { appRoutes } from '../../appRoutes'
import { AsyncStatePanel } from '../feedback/AsyncStatePanel'

export const TopicPreviewDialog = ({ topicId, onClose }: { topicId: number; onClose: () => void }) => {
  const [data, setData] = useState<{ topic: AdminTopic; bodyHtml: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(await getAdminTopicDetail(topicId, controller.signal))
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải nội dung xem trước.',
          )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [topicId, retry])
  return (
    <Dialog
      aria-label="Xem trước nội dung"
      isOpen
      onOpenChange={(open) => !open && onClose()}
      padding={0}
      width={850}
    >
      <div className="p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">Xem trước nội dung #{topicId}</h2>
        <div className="mt-5">
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            onRetry={() => setRetry((value) => value + 1)}
          />
        </div>
        {!isLoading && !error && data && (
          <>
            <h3 className="mt-4 text-lg font-bold">{data.topic.title}</h3>
            <p className="mt-2 text-xs text-slate-500">
              {data.topic.author.displayName} · {data.topic.category.name} ·{' '}
              {new Date(data.topic.createdAtUtc).toLocaleString('vi-VN')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="admin-badge">{data.topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}</span>
              {data.topic.isDeleted && <span className="admin-badge admin-badge-red">Tác giả đã xóa</span>}
              {data.topic.isHiddenByModerator && (
                <span className="admin-badge admin-badge-amber">Đang bị ẩn</span>
              )}
            </div>
            <div
              className="admin-preview fr-view reading-content mt-5"
              dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
            />
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {data &&
            data.topic.status === 'published' &&
            !data.topic.isDeleted &&
            !data.topic.isHiddenByModerator && (
              <Link className="admin-text-button" to={appRoutes.topic(topicId)}>
                Mở trên diễn đàn ↗
              </Link>
            )}
          <Button label="Đóng xem trước" onClick={onClose} variant="secondary" />
        </div>
      </div>
    </Dialog>
  )
}
