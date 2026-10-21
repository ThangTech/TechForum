import type { AdminAuditLog } from '../../api/adminOverview'

import { auditActionLabels } from './auditActionLabels'

export const AuditLogList = ({ items }: { items: AdminAuditLog[] }) => (
  <div className="admin-table-scroll">
    <table className="admin-table">
      <caption className="sr-only">Nhật ký thao tác quản trị</caption>
      <thead>
        <tr>
          <th>Thời điểm</th>
          <th>Quản trị viên</th>
          <th>Thao tác</th>
          <th>Đối tượng</th>
          <th>Lý do / Thay đổi</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="whitespace-nowrap">
              <time dateTime={item.createdAtUtc}>
                {new Date(item.createdAtUtc).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </time>
            </td>
            <td>
              <span className="admin-table-primary">{item.administrator.displayName}</span>
            </td>
            <td>
              <span className="admin-badge admin-badge-blue">
                {auditActionLabels[item.action] ?? item.action}
              </span>
            </td>
            <td>
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
            </td>
            <td>
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
