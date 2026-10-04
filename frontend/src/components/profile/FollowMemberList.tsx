import { Link } from 'react-router-dom'
import type { FollowMember } from '../../api/profiles'
import { appRoutes } from '../../appRoutes'

interface FollowMemberListProps {
  members: FollowMember[]
}

export const FollowMemberList = ({ members }: FollowMemberListProps) => {
  if (members.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Chưa có thành viên nào trong danh sách này.</p>
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {members.map((member) => (
        <li className="p-5 sm:p-6" key={member.id}>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-100 font-extrabold text-blue-700" aria-hidden="true">
              {member.displayName.slice(0, 1).toLocaleUpperCase('vi-VN')}
            </span>
            <div className="min-w-0">
              <Link className="font-extrabold text-slate-950 hover:text-blue-700" to={appRoutes.member(member.id)}>{member.displayName}</Link>
              {member.bio && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{member.bio}</p>}
              <p className="mt-2 text-xs text-slate-500">{member.publishedTopicCount} nội dung công khai</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
