import { useEffect, useState } from 'react'
import { getCategories, type Category } from '../api/categories'
import { getTags, type Tag } from '../api/tags'
import { CategoryPanel } from '../components/CategoryPanel'
import { TagPanel } from '../components/TagPanel'

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [tags, setTags] = useState<Tag[]>([])
  const [areTagsLoading, setAreTagsLoading] = useState(true)
  const [tagError, setTagError] = useState<string | null>(null)
  const [tagRequestVersion, setTagRequestVersion] = useState(0)

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

  useEffect(() => {
    const controller = new AbortController()

    async function loadTags() {
      setAreTagsLoading(true)
      setTagError(null)
      try {
        setTags(await getTags(controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setTagError(requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi không xác định.')
      } finally {
        if (!controller.signal.aborted) setAreTagsLoading(false)
      }
    }

    void loadTags()

    return () => controller.abort()
  }, [tagRequestVersion])

  return (
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

            <aside className="sidebar-stack">
              <TagPanel
                tags={tags}
                error={tagError}
                isLoading={areTagsLoading}
                onRetry={() => setTagRequestVersion((version) => version + 1)}
              />
              <div className="panel coming-soon" id="topics-coming-soon">
                <span className="coming-soon__label">Lộ trình sản phẩm</span>
                <h2>Chủ đề đang được xây dựng ở P2</h2>
                <p>Chuyên mục và thẻ hiện đều được tải từ TechForum API.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
  )
}
