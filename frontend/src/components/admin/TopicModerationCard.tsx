import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { AdminTopic, ModerationAction } from '../../api/adminTopics'
import { appRoutes } from '../../appRoutes'

export const TopicModerationCard = ({ topic, onAction }: { topic: AdminTopic; onAction: (action: ModerationAction) => void }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{topic.type === 'article' ? 'Bài viết' : 'Câu hỏi'}</span>
          {topic.isDeleted && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Tác giả đã xóa</span>}
          {topic.isHiddenByModerator && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Đang bị ẩn</span>}
          {topic.isDiscussionLocked && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Đã khóa</span>}
          {topic.isPinned && <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">Đã ghim</span>}
        </div>
        <h2 className="mt-3 text-xl font-extrabold text-slate-950">{topic.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{topic.author.displayName} · {topic.category.name}</p>
      </div>
      {!topic.isDeleted && !topic.isHiddenByModerator && topic.status === 'published' && <Link className="text-sm font-bold text-blue-700 hover:underline" to={appRoutes.topic(topic.id)}>Mở nội dung</Link>}
    </div>
    <footer className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
      {!topic.isDeleted && <Button label={topic.isHiddenByModerator ? 'Khôi phục' : 'Ẩn'} onClick={() => onAction(topic.isHiddenByModerator ? 'restore' : 'hide')} variant="secondary" />}
      <Button label={topic.isDiscussionLocked ? 'Mở thảo luận' : 'Khóa thảo luận'} onClick={() => onAction(topic.isDiscussionLocked ? 'unlock' : 'lock')} variant="secondary" />
      {!topic.isDeleted && <Button label={topic.isPinned ? 'Bỏ ghim' : 'Ghim'} onClick={() => onAction(topic.isPinned ? 'unpin' : 'pin')} variant="ghost" />}
      {!topic.isDeleted && <Button label="Chuyển chuyên mục" onClick={() => onAction('move')} variant="ghost" />}
    </footer>
  </article>
)
