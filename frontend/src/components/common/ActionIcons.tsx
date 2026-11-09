import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  // Solid icon, used for a toggle that is switched on (a star that is given, a saved bookmark).
  filled?: boolean
}

// Icons of the action buttons. They use currentColor, so they take the colour of the button around them.
const Icon = ({ size = 18, filled = false, children }: IconProps & { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    fill={filled ? 'currentColor' : 'none'}
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.8}
    viewBox="0 0 24 24"
    width={size}
  >
    {children}
  </svg>
)

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Icon>
)

export const StarActionIcon = (props: IconProps) => (
  <Icon {...props}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Icon>
)

export const BookmarkActionIcon = (props: IconProps) => (
  <Icon {...props}><path d="M6 3h12v18l-6-4-6 4z" /></Icon>
)

export const ThumbUpIcon = (props: IconProps) => (
  <Icon {...props}><path d="M7 10v11H3V10h4Zm0 0 5-7c1.8 0 2.5 1.2 2 3l-1 4h5a3 3 0 0 1 3 3l-1 6a2 2 0 0 1-2 2H7" /></Icon>
)

export const ShareIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></Icon>
)

export const FlagIcon = (props: IconProps) => (
  <Icon {...props}><path d="M5 21V4M5 4h12l-2 4 2 4H5" /></Icon>
)

export const ReplyIcon = (props: IconProps) => (
  <Icon {...props}><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v3" /></Icon>
)

export const CheckCircleIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Icon>
)

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" /></Icon>
)

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>
)

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>
)

export const CodeIcon = (props: IconProps) => (
  <Icon {...props}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Icon>
)

export const EyeIcon = (props: IconProps) => (
  <Icon {...props}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>
)
