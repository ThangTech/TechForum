import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/authState'
import { appRoutes } from '../../appRoutes'
import {
  ActivityIcon,
  ArticleIcon,
  CommunityIcon,
  DiscussionIcon,
  MyTopicsIcon,
  QuestionIcon,
  SavedIcon,
} from '../common/NavIcons'

interface ExploreLink {
  to: string
  label: string
  icon: ReactNode
  // Trang chủ và /articles cùng hiển thị danh sách bài viết nên cùng được đánh dấu đang chọn.
  alsoActiveOn?: string
}

const exploreLinks: ExploreLink[] = [
  { to: appRoutes.articles, label: 'Bài viết', icon: <ArticleIcon />, alsoActiveOn: appRoutes.home },
  { to: appRoutes.questions, label: 'Hỏi đáp', icon: <QuestionIcon /> },
  { to: appRoutes.discussions, label: 'Thảo luận', icon: <DiscussionIcon /> },
  { to: appRoutes.communities, label: 'Cộng đồng', icon: <CommunityIcon /> },
]

const memberLinks: ExploreLink[] = [
  { to: appRoutes.saved, label: 'Đã lưu', icon: <SavedIcon /> },
  { to: appRoutes.activity, label: 'Hoạt động của tôi', icon: <ActivityIcon /> },
  { to: appRoutes.myTopics, label: 'Nội dung của tôi', icon: <MyTopicsIcon /> },
]

const renderLinks = (links: ExploreLink[], currentPath: string) => links.map((link) => {
  const isCurrent = currentPath === link.to || currentPath === link.alsoActiveOn
  return (
    <li key={link.to}>
      <NavLink
        aria-current={isCurrent ? 'page' : undefined}
        className={`explore-nav__link${isCurrent ? ' explore-nav__link--active' : ''}`}
        end
        to={link.to}
      >
        {link.icon}
        <span>{link.label}</span>
      </NavLink>
    </li>
  )
})

interface ExploreNavProps {
  currentPath: string
}

export const ExploreNav = ({ currentPath }: ExploreNavProps) => {
  const { user } = useAuth()

  return (
    <nav aria-label="Khám phá TechForum" className="explore-nav surface-card">
      <h2 className="explore-nav__title">Khám phá</h2>
      <ul>{renderLinks(exploreLinks, currentPath)}</ul>
      {user && (
        <>
          <h2 className="explore-nav__title explore-nav__title--second">Của bạn</h2>
          <ul>{renderLinks(memberLinks, currentPath)}</ul>
        </>
      )}
    </nav>
  )
}
