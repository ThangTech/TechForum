import { Button } from '@astryxdesign/core/Button'
import type { AdminCategory } from '../../api/adminCategories'

interface CategoryAdminCardProps {
  busyId: number | null
  category: AdminCategory
  onEdit: (category: AdminCategory) => void
  onToggleActive: (category: AdminCategory) => void
}

export const CategoryAdminCard = ({ busyId, category, onEdit, onToggleActive }: CategoryAdminCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-extrabold text-slate-950">{category.name}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${category.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {category.isActive ? 'Đang sử dụng' : 'Đã ngừng sử dụng'}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">/{category.slug} · Thứ tự {category.displayOrder} · {category.topicCount} chủ đề</p>
      {category.description && <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>}
    </div>
    <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
      <Button isDisabled={busyId !== null} label="Sửa" onClick={() => onEdit(category)} variant="secondary" />
      <Button
        isDisabled={busyId !== null}
        isLoading={busyId === category.id}
        label={category.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        onClick={() => onToggleActive(category)}
        variant={category.isActive ? 'ghost' : 'primary'}
      />
    </div>
  </article>
)
