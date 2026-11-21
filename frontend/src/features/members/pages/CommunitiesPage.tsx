import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { useCommunitiesPage } from '../hooks/useCommunitiesPage'

export const CommunitiesPage = () => {
  const { tags, isLoading, error, retry } = useCommunitiesPage()

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
          onRetry={retry}
        />

        {!isLoading && !error && tags.length === 0 && (
          <Box className="surface-card" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Chưa có cộng đồng nào đang hoạt động.</Typography>
          </Box>
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
