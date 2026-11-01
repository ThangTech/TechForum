import { Button } from '@astryxdesign/core/Button'
import type { Tag } from '../api/tags'
import { Link } from 'react-router-dom'
import { appRoutes } from '../appRoutes'

interface TagPanelProps {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  selectedId?: number
  onSelect?: (id: number) => void
}

export const TagPanel = ({ tags, isLoading, error, onRetry, selectedId, onSelect }: TagPanelProps) => {
  return (
    <section className="surface-card" aria-labelledby="tag-title">
      <div className="border-b border-slate-200 px-4 py-3.5">
        <div>
          <h2 className="text-[0.95rem] font-bold tracking-tight text-slate-900" id="tag-title">
            Thẻ công nghệ
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Các thẻ đang được sử dụng trên TechForum.
          </p>
          <Link className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline" to={appRoutes.communities}>
            Xem tất cả cộng đồng →
          </Link>
        </div>
      </div>

      {isLoading && <div className="p-5 text-sm text-slate-500" role="status">Đang tải thẻ…</div>}
      {!isLoading && error && (
        <div className="space-y-3 p-5 text-sm leading-6 text-slate-500" role="alert">
          <p className="m-0">{error}</p>
          <Button label="Thử lại" variant="secondary" onClick={onRetry} />
        </div>
      )}
      {!isLoading && !error && tags.length === 0 && (
        <div className="p-5 text-sm text-slate-500">Chưa có thẻ đang hoạt động.</div>
      )}
      {!isLoading && !error && tags.length > 0 && (
        <ul className="flex list-none flex-wrap gap-2 p-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              {onSelect ? <button className="tag-filter" aria-pressed={selectedId === tag.id} onClick={() => onSelect(tag.id)} type="button">
                #{tag.name}
              </button> : <Link className="block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:border-blue-400 hover:bg-blue-100" to={appRoutes.skill(tag.id)}>
                #{tag.name}
              </Link>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
