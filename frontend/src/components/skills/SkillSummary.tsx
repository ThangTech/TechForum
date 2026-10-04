import { Link } from 'react-router-dom'
import type { SkillCommunity } from '../../api/skills'
import { appRoutes } from '../../appRoutes'

interface SkillSummaryProps {
  community: SkillCommunity
}

export const SkillSummary = ({ community }: SkillSummaryProps) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="eyebrow">Kỹ năng cộng đồng</p>
    <h1 className="text-3xl font-extrabold text-slate-950">#{community.tag.name}</h1>
    {community.tag.description && <p className="mt-3 text-slate-600">{community.tag.description}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-slate-50 p-4">
        <strong className="text-xl text-slate-950">{community.topicCount}</strong>
        <span className="ml-2 text-sm text-slate-600">nội dung công khai</span>
      </div>
      <div className="rounded-lg bg-slate-50 p-4">
        <strong className="text-xl text-slate-950">{community.memberCount}</strong>
        <span className="ml-2 text-sm text-slate-600">thành viên sử dụng</span>
      </div>
    </div>
    <Link
      className="mt-5 inline-block text-sm font-bold text-blue-700 hover:underline"
      to={`${appRoutes.home}?tagId=${community.tag.id}`}
    >
      Xem bài viết gắn thẻ này →
    </Link>
  </section>
)
