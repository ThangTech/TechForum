import { Button } from '@astryxdesign/core/Button'
import type { Tag } from '../api/tags'

interface TagPanelProps {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function TagPanel({ tags, isLoading, error, onRetry }: TagPanelProps) {
  return (
    <section className="panel tag-panel" aria-labelledby="tag-title">
      <div className="panel__heading">
        <div>
          <h2 id="tag-title">Thẻ công nghệ</h2>
          <p>Các thẻ đang được sử dụng trên TechForum.</p>
        </div>
      </div>

      {isLoading && <div className="compact-status" role="status">Đang tải thẻ…</div>}
      {!isLoading && error && (
        <div className="compact-status" role="alert">
          <p>{error}</p>
          <Button label="Thử lại" variant="secondary" onClick={onRetry} />
        </div>
      )}
      {!isLoading && !error && tags.length === 0 && (
        <div className="compact-status">Chưa có thẻ đang hoạt động.</div>
      )}
      {!isLoading && !error && tags.length > 0 && (
        <ul className="tag-list">
          {tags.map((tag) => <li key={tag.id}>#{tag.name}</li>)}
        </ul>
      )}
    </section>
  )
}
