// Icon nhỏ cho số liệu trong thẻ bài; dùng currentColor nên đổi màu theo chữ xung quanh.
const iconProps = {
  'aria-hidden': true,
  fill: 'none',
  height: 14,
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
  width: 14,
} as const

export const ViewIcon = () => (
  <svg {...iconProps}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
)

export const CommentIcon = () => (
  <svg {...iconProps}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
)

export const StarIcon = () => (
  <svg {...iconProps}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
)

export const BookmarkIcon = () => (
  <svg {...iconProps}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
)
