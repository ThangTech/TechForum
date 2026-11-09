import Box from '@mui/material/Box'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { AdminBanner } from '../../api/adminBanners'
import { toMediaUrl } from '../../api/media'
import { getBannerStatus } from './bannerStatus'
import { StatusBadge } from './StatusBadge'

const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export const BannerAdminCard = ({
  banner,
  busyId,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  banner: AdminBanner
  busyId: number | null
  onEdit: (banner: AdminBanner) => void
  onToggleActive: (banner: AdminBanner) => void
  onDelete: (banner: AdminBanner) => void
}) => {
  const status = getBannerStatus(banner)

  return (
    <TableRow>
      <TableCell>
        <Box
          alt={banner.title}
          component="img"
          src={toMediaUrl(banner.imageUrl)}
          sx={{ display: 'block', width: 160, minWidth: 160, height: 64, objectFit: 'cover', borderRadius: '4px', bgcolor: '#eef1f5' }}
        />
      </TableCell>
      <TableCell>
        <strong className="admin-table-primary">{banner.title}</strong>
        <span className="admin-table-secondary">{banner.linkUrl ?? 'Không có liên kết'}</span>
      </TableCell>
      <TableCell>{banner.displayOrder}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {banner.startsAtUtc || banner.endsAtUtc ? (
          <Typography component="span" sx={{ fontSize: '0.8125rem' }}>
            {banner.startsAtUtc ? formatTime(banner.startsAtUtc) : 'Ngay'} → {banner.endsAtUtc ? formatTime(banner.endsAtUtc) : 'Không giới hạn'}
          </Typography>
        ) : (
          <span className="admin-table-secondary" style={{ marginTop: 0 }}>Luôn hiển thị</span>
        )}
      </TableCell>
      <TableCell><StatusBadge tone={status.tone}>{status.label}</StatusBadge></TableCell>
      <TableCell>
        <div className="admin-table-actions">
          <button disabled={busyId !== null} onClick={() => onEdit(banner)} type="button">Sửa</button>
          <button disabled={busyId !== null} onClick={() => onToggleActive(banner)} type="button">
            {busyId === banner.id ? 'Đang xử lý…' : banner.isActive ? 'Tắt' : 'Bật'}
          </button>
          <button disabled={busyId !== null} onClick={() => onDelete(banner)} type="button">Xóa</button>
        </div>
      </TableCell>
    </TableRow>
  )
}
