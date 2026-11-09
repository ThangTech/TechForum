import type { AdminAuditLog } from '../../api/adminOverview'

import { auditActionLabels } from './auditActionLabels'
import { StatusBadge } from './StatusBadge'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

export const AuditLogList = ({ items }: { items: AdminAuditLog[] }) => (
  <div className="admin-table-scroll">
    <Table className="admin-table" size="small">
      <caption className="sr-only">Nhật ký thao tác quản trị</caption>
      <TableHead>
        <TableRow>
          <TableCell>Thời điểm</TableCell>
          <TableCell>Quản trị viên</TableCell>
          <TableCell>Thao tác</TableCell>
          <TableCell>Đối tượng</TableCell>
          <TableCell>Lý do / Thay đổi</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              <time dateTime={item.createdAtUtc}>
                {new Date(item.createdAtUtc).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </time>
            </TableCell>
            <TableCell>
              <span className="admin-table-primary">{item.administrator.displayName}</span>
            </TableCell>
            <TableCell>
              <StatusBadge tone="blue">
                {auditActionLabels[item.action] ?? item.action}
              </StatusBadge>
            </TableCell>
            <TableCell>
              {(
                {
                  topic: 'Chủ đề',
                  answer: 'Câu trả lời',
                  account: 'Tài khoản',
                  report: 'Báo cáo',
                  category: 'Chuyên mục',
                  tag: 'Thẻ',
                  banner: 'Banner',
                } as Record<string, string>
              )[item.targetType.toLowerCase()] ?? item.targetType}
              <span className="admin-table-secondary" style={{ maxWidth: 192 }}>#{item.targetId}</span>
            </TableCell>
            <TableCell>
              <Typography sx={{ minWidth: 160, maxWidth: 320, overflowWrap: 'break-word', fontSize: 'inherit' }}>{item.reason}</Typography>
              {(item.previousValue || item.newValue) && (
                <Box className="admin-audit-values" component="details" sx={{ mt: 1 }}>
                  <summary>Trạng thái trước / sau</summary>
                  <Typography sx={{ mt: 1, fontSize: 'inherit' }}>
                    <strong>Trước:</strong> {item.previousValue ?? '—'}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 'inherit' }}>
                    <strong>Sau:</strong> {item.newValue ?? '—'}
                  </Typography>
                </Box>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
