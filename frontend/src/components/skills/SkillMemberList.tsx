import { Link } from 'react-router-dom'
import type { SkillMember } from '../../api/skills'
import { appRoutes } from '../../appRoutes'

interface SkillMemberListProps {
  members: SkillMember[]
}

export const SkillMemberList = ({ members }: SkillMemberListProps) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-xl font-bold text-slate-950">Thành viên có kỹ năng này</h2>
    </div>
    {members.length === 0 ? (
      <p className="p-8 text-center text-sm text-slate-500">Chưa có nội dung công khai dùng thẻ này.</p>
    ) : (
      <ul className="divide-y divide-slate-200">
        {members.map((member) => (
          <li className="flex items-center justify-between gap-4 p-5" key={member.id}>
            <Link className="font-bold text-slate-900 hover:text-blue-700" to={appRoutes.member(member.id)}>
              {member.displayName}
            </Link>
            <span className="text-sm text-slate-500">{member.topicCount} nội dung</span>
          </li>
        ))}
      </ul>
    )}
  </section>
)
