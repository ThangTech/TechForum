import type { AdminAuditLog } from '../../api/adminOverview'

import { auditActionLabels } from './auditActionLabels'
import { StatusBadge } from './StatusBadge'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

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
            <TableCell className="whitespace-nowrap">
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
                } as Record<string, string>
              )[item.targetType.toLowerCase()] ?? item.targetType}
              <span className="admin-table-secondary max-w-48">#{item.targetId}</span>
            </TableCell>
            <TableCell>
              <p className="min-w-40 max-w-80 break-words">{item.reason}</p>
              {(item.previousValue || item.newValue) && (
                <details className="admin-audit-values mt-2">
                  <summary>Trạng thái trước / sau</summary>
                  <p className="mt-2">
                    <strong>Trước:</strong> {item.previousValue ?? '—'}
                  </p>
                  <p className="mt-1">
                    <strong>Sau:</strong> {item.newValue ?? '—'}
                  </p>
                </details>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
