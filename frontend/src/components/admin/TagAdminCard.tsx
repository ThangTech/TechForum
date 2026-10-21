import type { AdminTag } from '../../api/adminTags'

export const TagAdminCard = ({
  busyId,
  tag,
  onEdit,
  onToggleActive,
}: {
  busyId: number | null
  tag: AdminTag
  onEdit: (tag: AdminTag) => void
  onToggleActive: (tag: AdminTag) => void
}) => (
  <tr>
    <td>
      <strong className="admin-table-primary">#{tag.name}</strong>
      <span className="admin-table-secondary">/{tag.slug}</span>
      {tag.description && <p className="mt-2 max-w-96 text-xs">{tag.description}</p>}
    </td>
    <td>{tag.topicCount}</td>
    <td>
      <span className={`admin-badge ${tag.isActive ? 'admin-badge-green' : ''}`}>
        {tag.isActive ? 'Đang sử dụng' : 'Đã ngừng'}
      </span>
    </td>
    <td>
      <div className="admin-table-actions">
        <button disabled={busyId !== null} onClick={() => onEdit(tag)} type="button">
          Sửa
        </button>
        <button disabled={busyId !== null} onClick={() => onToggleActive(tag)} type="button">
          {busyId === tag.id ? 'Đang xử lý…' : tag.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        </button>
      </div>
    </td>
  </tr>
)
