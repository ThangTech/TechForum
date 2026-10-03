import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { ActivityPage } from '../../api/activity'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const ActivityList = ({ data, onPageChange }: { data: ActivityPage; onPageChange: (page: number) => void }) => {
  if (data.items.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Bạn chưa có hoạt động công khai nào.</div>
  }
  return (
    <>
      <ol className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {data.items.map((item, index) => (
          <li className="p-5 sm:p-6" key={`${item.type}-${item.link}-${index}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
              {item.type === 'topic-created' ? 'Nội dung' : 'Thảo luận'}
            </span>
            <Link className="mt-1 block font-bold text-slate-950 hover:text-blue-700" to={item.link}>{item.title}</Link>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <time className="mt-2 block text-xs text-slate-500" dateTime={item.occurredAtUtc}>{formatDate(item.occurredAtUtc)}</time>
          </li>
        ))}
      </ol>
      {data.totalPages > 1 && <div className="mt-5 flex items-center justify-between gap-4"><Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => onPageChange(data.page - 1)} variant="secondary" /><span className="text-sm text-slate-600">Trang {data.page}/{data.totalPages}</span><Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => onPageChange(data.page + 1)} variant="secondary" /></div>}
    </>
  )
}
