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

export const SearchIcon = () => (
  <svg {...iconProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

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

export const DashboardIcon = () => (
  <svg {...iconProps}><rect height="7" rx="1.5" width="7" x="3" y="3" /><rect height="7" rx="1.5" width="7" x="14" y="3" /><rect height="7" rx="1.5" width="7" x="3" y="14" /><rect height="7" rx="1.5" width="7" x="14" y="14" /></svg>
)

export const FlagIcon = () => (
  <svg {...iconProps}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
)

export const FolderIcon = () => (
  <svg {...iconProps}><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
)

export const TagIcon = () => (
  <svg {...iconProps}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></svg>
)

export const BannerIcon = () => (
  <svg {...iconProps}><rect height="14" rx="2" width="18" x="3" y="5" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></svg>
)

export const ClipboardIcon = () => (
  <svg {...iconProps}><rect height="18" rx="2" width="14" x="5" y="3" /><path d="M9 3v2h6V3M9 11h6M9 15h6" /></svg>
)

export const ShieldIcon = () => (
  <svg {...iconProps}><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>
)
