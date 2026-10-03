import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { OwnTopicPage } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { TopicTypeBadge } from './TopicTypeBadge'

interface OwnTopicListProps {
  data: OwnTopicPage
  onDelete: (id: number) => void
  onPageChange: (page: number) => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
}).format(new Date(value))

export const OwnTopicList = ({ data, onDelete, onPageChange }: OwnTopicListProps) => {
  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-600">Bạn chưa có nội dung phù hợp với bộ lọc.</p>
        <Link className="mt-4 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white" to={appRoutes.write}>
          Viết nội dung đầu tiên
        </Link>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Danh sách nội dung của tôi">
      <ul className="divide-y divide-slate-200">
        {data.items.map((topic) => (
          <li className="p-5 sm:p-6" key={topic.id}>
            <div className="flex flex-wrap items-center gap-2">
              <TopicTypeBadge type={topic.type} />
              <span className={topic.status === 'published'
                ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800'
                : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700'}>
                {topic.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
              {topic.isHiddenByModerator && <span className="text-xs font-bold text-red-700">Đã bị ẩn bởi quản trị viên</span>}
              {topic.isDiscussionLocked && <span className="text-xs font-semibold text-slate-500">Đã khóa thảo luận</span>}
            </div>
            {topic.status === 'published' && !topic.isHiddenByModerator ? (
              <Link className="mt-3 block text-lg font-bold text-slate-950 hover:text-blue-700" to={appRoutes.topic(topic.id)}>
                {topic.title}
              </Link>
            ) : (
              <h2 className="mt-3 text-lg font-bold text-slate-950">{topic.title}</h2>
            )}
            <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs text-slate-500">
              <span>{topic.category.name}</span>
              <span aria-hidden="true">·</span>
              <span>Tạo {formatDate(topic.createdAtUtc)}</span>
              {topic.updatedAtUtc && <span>· Cập nhật {formatDate(topic.updatedAtUtc)}</span>}
            </div>
            {topic.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" key={tag.id}>#{tag.name}</span>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700" to={appRoutes.editTopic(topic.id)}>
                Chỉnh sửa
              </Link>
              <Button label="Xóa" onClick={() => onDelete(topic.id)} variant="ghost" />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-600">
        <span>Trang {data.page} / {Math.max(data.totalPages, 1)} · {data.totalItems} nội dung</span>
        <div className="flex gap-2">
          <Button isDisabled={data.page <= 1} label="Trang trước" onClick={() => onPageChange(data.page - 1)} variant="secondary" />
          <Button isDisabled={data.page >= data.totalPages} label="Trang sau" onClick={() => onPageChange(data.page + 1)} variant="secondary" />
        </div>
      </div>
    </section>
  )
}
