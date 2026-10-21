import type { AdminCategory } from '../../api/adminCategories'

export const CategoryAdminCard = ({
  busyId,
  category,
  onEdit,
  onToggleActive,
}: {
  busyId: number | null
  category: AdminCategory
  onEdit: (category: AdminCategory) => void
  onToggleActive: (category: AdminCategory) => void
}) => (
  <tr>
    <td>
      <strong className="admin-table-primary">{category.name}</strong>
      <span className="admin-table-secondary">/{category.slug}</span>
      {category.description && <p className="mt-2 max-w-96 text-xs">{category.description}</p>}
    </td>
    <td>{category.displayOrder}</td>
    <td>{category.topicCount}</td>
    <td>
      <span className={`admin-badge ${category.isActive ? 'admin-badge-green' : ''}`}>
        {category.isActive ? 'Đang sử dụng' : 'Đã ngừng'}
      </span>
    </td>
    <td>
      <div className="admin-table-actions">
        <button disabled={busyId !== null} onClick={() => onEdit(category)} type="button">
          Sửa
        </button>
        <button disabled={busyId !== null} onClick={() => onToggleActive(category)} type="button">
          {busyId === category.id ? 'Đang xử lý…' : category.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        </button>
      </div>
    </td>
  </tr>
)
