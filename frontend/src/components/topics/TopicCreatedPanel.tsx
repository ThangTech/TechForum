import { Link } from 'react-router-dom'
import type { OwnTopic } from '../../api/topics'

interface TopicCreatedPanelProps {
  topic: OwnTopic
  onReset: () => void
}

export const TopicCreatedPanel = ({ topic, onReset }: TopicCreatedPanelProps) => (
  <main className="main-area" id="main-content">
    <div className="mx-auto w-[min(720px,calc(100%-40px))] py-12">
      <section className="rounded-xl border border-green-200 bg-white p-8 text-center" role="status">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">Đã lưu thành công</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">{topic.title}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {topic.status === 'published' ? 'Nội dung đã được xuất bản.' : 'Bản nháp chỉ bạn mới có thể quản lý.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {topic.status === 'published' && (
            <Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white" to={`/noi-dung/${topic.id}`}>
              Xem nội dung
            </Link>
          )}
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700" onClick={onReset} type="button">
            Soạn nội dung khác
          </button>
        </div>
      </section>
    </div>
  </main>
)
