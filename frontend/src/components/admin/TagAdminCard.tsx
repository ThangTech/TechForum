import { Button } from '@astryxdesign/core/Button'
import type { AdminTag } from '../../api/adminTags'

interface TagAdminCardProps {
  busyId: number | null
  onEdit: (tag: AdminTag) => void
  onToggleActive: (tag: AdminTag) => void
  tag: AdminTag
}

export const TagAdminCard = ({ busyId, onEdit, onToggleActive, tag }: TagAdminCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-extrabold text-slate-950">#{tag.name}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tag.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {tag.isActive ? 'Đang sử dụng' : 'Đã ngừng sử dụng'}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">/{tag.slug} · {tag.topicCount} chủ đề</p>
      {tag.description && <p className="mt-2 text-sm leading-6 text-slate-600">{tag.description}</p>}
    </div>
    <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
      <Button isDisabled={busyId !== null} label="Sửa" onClick={() => onEdit(tag)} variant="secondary" />
      <Button
        isDisabled={busyId !== null}
        isLoading={busyId === tag.id}
        label={tag.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        onClick={() => onToggleActive(tag)}
        variant={tag.isActive ? 'ghost' : 'primary'}
      />
    </div>
  </article>
)
