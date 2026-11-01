// Icon cho khối điều hướng; dùng currentColor nên đổi màu theo trạng thái liên kết.
const iconProps = {
  'aria-hidden': true,
  fill: 'none',
  height: 18,
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
  width: 18,
} as const

export const ArticleIcon = () => (
  <svg {...iconProps}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h7" /></svg>
)

export const QuestionIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>
)

export const DiscussionIcon = () => (
  <svg {...iconProps}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
)

export const CommunityIcon = () => (
  <svg {...iconProps}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.4-3.3 3-5 6-5s5.6 1.7 6 5" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 15.3c1.7.6 2.8 2.1 3 4.7" /></svg>
)

export const SavedIcon = () => (
  <svg {...iconProps}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
)

export const ActivityIcon = () => (
  <svg {...iconProps}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
)

export const MyTopicsIcon = () => (
  <svg {...iconProps}><path d="M4 20h4l11-11-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
)
