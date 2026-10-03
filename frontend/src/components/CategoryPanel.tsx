import { Button } from '@astryxdesign/core/Button'
import type { Category } from '../api/categories'

interface CategoryPanelProps {
  categories: Category[]
  error: string | null
  isLoading: boolean
  onRetry: () => void
}

const getCategoryMark = (name: string) => {
  return name.trim().slice(0, 1).toLocaleUpperCase('vi-VN') || '•'
}

export const CategoryPanel = ({
  categories,
  error,
  isLoading,
  onRetry,
}: CategoryPanelProps) => {
  return (
    <section className="panel" id="categories" aria-labelledby="categories-title">
      <div className="panel__heading">
        <div>
          <h2 id="categories-title">Chuyên mục công nghệ</h2>
          <p>Duyệt các lĩnh vực đang có trên TechForum.</p>
        </div>
        {!isLoading && !error && (
          <span className="panel__count">{categories.length} chuyên mục</span>
        )}
      </div>

      <div aria-live="polite">
        {isLoading && <CategoryLoading />}

        {!isLoading && error && (
          <div className="status-box" role="alert">
            <h3>Chưa tải được chuyên mục</h3>
            <p>{error} Kiểm tra API đang chạy rồi thử lại.</p>
            <div className="retry-action">
              <Button label="Thử lại" variant="primary" onClick={onRetry} />
            </div>
          </div>
        )}

        {!isLoading && !error && categories.length === 0 && (
          <div className="status-box">
            <h3>Chưa có chuyên mục</h3>
            <p>Danh sách hiện đang trống. Vui lòng quay lại sau.</p>
          </div>
        )}

        {!isLoading && !error && categories.length > 0 && (
          <ul className="category-list">
            {categories.map((category) => (
              <li className="category-item" key={category.id}>
                <span className="category-item__mark" aria-hidden="true">
                  {getCategoryMark(category.name)}
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'Chưa có mô tả cho chuyên mục này.'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

const CategoryLoading = () => {
  return (
    <div className="loading-list" aria-label="Đang tải chuyên mục">
      {[0, 1, 2].map((item) => (
        <div className="loading-row" key={item} aria-hidden="true">
          <div className="loading-block" />
          <div>
            <div className="loading-line" />
            <div className="loading-line" />
          </div>
        </div>
      ))}
    </div>
  )
}
