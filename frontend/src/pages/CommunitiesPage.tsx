import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTags, type Tag } from '../api/tags'
import { appRoutes } from '../appRoutes'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

export const CommunitiesPage = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadTags = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setTags(await getTags(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadTags()
    return () => controller.abort()
  }, [requestVersion])

  return (
    <main className="main-area" id="main-content">
      <div className="page-content">
        <section className="home-hero" aria-labelledby="page-title">
          <div className="home-hero__copy">
            <p className="eyebrow">Cộng đồng kỹ năng</p>
            <h1 id="page-title">Tìm người cùng chí hướng</h1>
            <p className="home-hero__description">
              Mỗi thẻ công nghệ là một cộng đồng nhỏ. Chọn một kỹ năng để xem bài viết và những thành viên đang hoạt động trong đó.
            </p>
          </div>
        </section>

        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải cộng đồng…"
          onRetry={() => setRequestVersion((version) => version + 1)}
        />

        {!isLoading && !error && tags.length === 0 && (
          <div className="surface-card p-8 text-center text-sm text-slate-600">Chưa có cộng đồng nào đang hoạt động.</div>
        )}

        {!isLoading && !error && tags.length > 0 && (
          <ul className="community-grid">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link className="community-card surface-card" to={appRoutes.skill(tag.id)}>
                  <span className="community-card__tag">#{tag.name}</span>
                  <span className="community-card__description">
                    {tag.description || 'Thảo luận và chia sẻ kinh nghiệm về chủ đề này.'}
                  </span>
                  <span className="community-card__action">Xem cộng đồng →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
