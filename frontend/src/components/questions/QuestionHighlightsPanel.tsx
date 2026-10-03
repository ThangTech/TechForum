import { Button } from '@astryxdesign/core/Button'
import { Link } from 'react-router-dom'
import type { QuestionHighlight, QuestionHighlights } from '../../api/questionHighlights'
import { appRoutes } from '../../appRoutes'

interface QuestionHighlightsPanelProps {
  data: QuestionHighlights | null
  error: string | null
  isLoading: boolean
  onRetry: () => void
}

const QuestionList = ({ items }: { items: QuestionHighlight[] }) => items.length === 0
  ? <p className="px-5 py-5 text-sm text-slate-500">Chưa có câu hỏi phù hợp.</p>
  : <ol className="divide-y divide-slate-100">{items.map((item) => <li className="px-5 py-4" key={item.id}><Link className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 hover:text-blue-700" to={appRoutes.topic(item.id)}>{item.title}</Link><span className="mt-1 block text-xs text-slate-500">{item.answerCount} câu trả lời</span></li>)}</ol>

export const QuestionHighlightsPanel = ({ data, error, isLoading, onRetry }: QuestionHighlightsPanelProps) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="question-highlights-title">
    <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950" id="question-highlights-title">Câu hỏi cộng đồng</h2></div>
    {isLoading && <p className="px-5 py-8 text-center text-sm text-slate-500" role="status">Đang tải câu hỏi…</p>}
    {!isLoading && error && <div className="px-5 py-6 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><div className="mt-3"><Button label="Thử lại" onClick={onRetry} variant="secondary" /></div></div>}
    {!isLoading && !error && data && <><div className="bg-slate-50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">Mới nhất</div><QuestionList items={data.latest} /><div className="border-t border-slate-200 bg-slate-50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">Nhiều câu trả lời · {data.periodDays} ngày</div><QuestionList items={data.mostAnswered} /></>}
  </section>
)
