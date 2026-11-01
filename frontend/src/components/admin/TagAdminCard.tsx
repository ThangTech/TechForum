import type { AdminTag } from '../../api/adminTags'
import { StatusBadge } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

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
  <TableRow>
    <TableCell>
      <strong className="admin-table-primary">#{tag.name}</strong>
      <span className="admin-table-secondary">/{tag.slug}</span>
      {tag.description && <p className="mt-2 max-w-96 text-xs">{tag.description}</p>}
    </TableCell>
    <TableCell>{tag.topicCount}</TableCell>
    <TableCell>
      <StatusBadge tone={tag.isActive ? 'green' : 'neutral'}>
        {tag.isActive ? 'Đang sử dụng' : 'Đã ngừng'}
      </StatusBadge>
    </TableCell>
    <TableCell>
      <div className="admin-table-actions">
        <button disabled={busyId !== null} onClick={() => onEdit(tag)} type="button">
          Sửa
        </button>
        <button disabled={busyId !== null} onClick={() => onToggleActive(tag)} type="button">
          {busyId === tag.id ? 'Đang xử lý…' : tag.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        </button>
      </div>
    </TableCell>
  </TableRow>
)
