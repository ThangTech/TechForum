import { Button } from '@astryxdesign/core/Button'
import type { NotificationPage } from '../../api/notifications'

interface NotificationListProps {
  data: NotificationPage
  busyId: number | null
  onOpen: (id: number, link: string, isRead: boolean) => void
  onPageChange: (page: number) => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const NotificationList = ({ data, busyId, onOpen, onPageChange }: NotificationListProps) => {
  if (data.items.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Bạn chưa có thông báo nào.</div>
  }

  return (
    <>
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {data.items.map((item) => (
          <li className={`p-5 sm:p-6 ${item.readAtUtc ? '' : 'bg-blue-50/60'}`} key={item.id}>
            <button
              className="w-full text-left disabled:opacity-60"
              disabled={busyId === item.id}
              onClick={() => onOpen(item.id, item.link, item.readAtUtc !== null)}
              type="button"
            >
              <span className="flex items-start justify-between gap-4">
                <span>
                  <strong className="block text-sm text-slate-950">{item.title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{item.message}</span>
                </span>
                {!item.readAtUtc && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Chưa đọc" />}
              </span>
              <time className="mt-3 block text-xs text-slate-500" dateTime={item.createdAtUtc}>{formatDate(item.createdAtUtc)}</time>
            </button>
          </li>
        ))}
      </ul>
      {data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => onPageChange(data.page - 1)} variant="secondary" />
          <span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span>
          <Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => onPageChange(data.page + 1)} variant="secondary" />
        </div>
      )}
    </>
  )
}
