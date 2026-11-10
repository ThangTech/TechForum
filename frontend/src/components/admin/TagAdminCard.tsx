import type { AdminTag } from '../../api/adminTags'
import { StatusBadge } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableRow from '@mui/material/TableRow'

export const TagAdminCard = ({
  busyId,
  tag,
  onEdit,
  onToggleActive,
}: {
  busyId: string | null
  tag: AdminTag
  onEdit: (tag: AdminTag) => void
  onToggleActive: (tag: AdminTag) => void
}) => (
  <TableRow>
    <TableCell>
      <strong className="admin-table-primary">#{tag.name}</strong>
      <span className="admin-table-secondary">/{tag.slug}</span>
      {tag.description && <Typography sx={{ mt: 1, maxWidth: 384, fontSize: '0.75rem' }}>{tag.description}</Typography>}
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
