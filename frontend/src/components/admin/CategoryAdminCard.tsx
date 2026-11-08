import type { AdminCategory } from '../../api/adminCategories'
import { StatusBadge } from './StatusBadge'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableRow from '@mui/material/TableRow'

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
  <TableRow>
    <TableCell>
      <strong className="admin-table-primary">{category.name}</strong>
      <span className="admin-table-secondary">/{category.slug}</span>
      {category.description && <Typography sx={{ mt: 1, maxWidth: 384, fontSize: '0.75rem' }}>{category.description}</Typography>}
    </TableCell>
    <TableCell>{category.displayOrder}</TableCell>
    <TableCell>{category.topicCount}</TableCell>
    <TableCell>
      <StatusBadge tone={category.isActive ? 'green' : 'neutral'}>
        {category.isActive ? 'Đang sử dụng' : 'Đã ngừng'}
      </StatusBadge>
    </TableCell>
    <TableCell>
      <div className="admin-table-actions">
        <button disabled={busyId !== null} onClick={() => onEdit(category)} type="button">
          Sửa
        </button>
        <button disabled={busyId !== null} onClick={() => onToggleActive(category)} type="button">
          {busyId === category.id ? 'Đang xử lý…' : category.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}
        </button>
      </div>
    </TableCell>
  </TableRow>
)
