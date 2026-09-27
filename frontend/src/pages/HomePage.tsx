import { useEffect, useState } from 'react'
import { getCategories, type Category } from '../api/categories'
import { CategoryPanel } from '../components/CategoryPanel'
import { SiteHeader } from '../components/SiteHeader'

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getCategories(controller.signal)
        setCategories(result)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Đã xảy ra lỗi không xác định.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadCategories()
    return () => controller.abort()
  }, [requestVersion])

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="main-area" id="main-content">
        <div className="page-content">
          <section className="intro" aria-labelledby="page-title">
            <p className="eyebrow">Cộng đồng công nghệ Việt</p>
            <h1 id="page-title">Cùng học hỏi, chia sẻ và làm chủ công nghệ.</h1>
            <p className="intro__description">
              Khám phá các chuyên mục để bắt đầu theo dõi những lĩnh vực bạn quan tâm.
            </p>
          </section>

          <div className="content-grid">
            <CategoryPanel
              categories={categories}
              error={error}
              isLoading={isLoading}
              onRetry={() => setRequestVersion((version) => version + 1)}
            />

            <aside className="panel coming-soon" id="topics-coming-soon">
              <span className="coming-soon__label">Lộ trình sản phẩm</span>
              <h2>Chủ đề sẽ được bổ sung ở M3</h2>
              <p>
                Hiện tại bạn có thể duyệt dữ liệu chuyên mục thật từ TechForum API.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <span>TechForum · Nơi kiến thức được sẻ chia</span>
          <span>Phiên bản M1</span>
        </div>
      </footer>
    </div>
  )
}
