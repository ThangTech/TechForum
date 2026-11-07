import { Link } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import { useTags } from '../queries/tags'

export const CommunitiesPage = () => {
  const tagsQuery = useTags()
  const tags = tagsQuery.data ?? []
  const isLoading = isInitialLoading(tagsQuery)
  const error = getErrorMessage(tagsQuery.error)

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
          onRetry={() => void tagsQuery.refetch()}
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
