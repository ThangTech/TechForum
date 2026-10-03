import type { AdminAuditLog } from '../../api/adminOverview'

const actionLabels: Record<string, string> = {
  'topic.hide': 'Ẩn nội dung', 'topic.restore': 'Khôi phục nội dung',
  'topic.lock': 'Khóa thảo luận', 'topic.unlock': 'Mở thảo luận',
  'topic.pin': 'Ghim nội dung', 'topic.unpin': 'Bỏ ghim', 'topic.move': 'Chuyển chuyên mục',
}

export const AuditLogList = ({ items }: { items: AdminAuditLog[] }) => (
  <div className="grid gap-3">
    {items.map((item) => (
      <article className="rounded-xl border border-slate-200 bg-white p-5" key={item.id}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-slate-950">{actionLabels[item.action] ?? item.action}</h3>
          <time className="text-xs text-slate-500" dateTime={item.createdAtUtc}>
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAtUtc))}
          </time>
        </div>
        <p className="mt-2 text-sm text-slate-600">{item.administrator.displayName} · {item.targetType} #{item.targetId}</p>
        <p className="mt-2 text-sm leading-6 text-slate-800"><strong>Lý do:</strong> {item.reason}</p>
        {(item.previousValue || item.newValue) && (
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer font-bold">Xem trạng thái trước/sau</summary>
            <p className="mt-2 break-words">Trước: {item.previousValue ?? '—'}</p>
            <p className="mt-1 break-words">Sau: {item.newValue ?? '—'}</p>
          </details>
        )}
      </article>
    ))}
  </div>
)
