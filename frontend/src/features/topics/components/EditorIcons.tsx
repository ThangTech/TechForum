import type { ReactNode } from 'react'

// Biểu tượng của thanh công cụ soạn thảo, dùng currentColor để theo màu nút.
const Icon = ({ children }: { children: ReactNode }) => (
  <svg aria-hidden="true" fill="none" height={18} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={18}>
    {children}
  </svg>
)

export const BoldIcon = () => <Icon><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" /></Icon>
export const ItalicIcon = () => <Icon><path d="M10 5h8M6 19h8M14 5l-4 14" /></Icon>
export const UnderlineIcon = () => <Icon><path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" /></Icon>
export const StrikeIcon = () => <Icon><path d="M5 12h14M16 6.5A4 4 0 0 0 12 5c-2.5 0-4 1.3-4 3 0 1.5 1 2.4 3 3M8 17.5A4.5 4.5 0 0 0 12 19c2.5 0 4-1.4 4-3.2" /></Icon>
export const OrderedListIcon = () => <Icon><path d="M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M4 14.5a1 1 0 0 1 2 .3L4 19h2" /></Icon>
export const BulletListIcon = () => <Icon><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Icon>
export const QuoteIcon = () => <Icon><path d="M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z" /></Icon>
export const LinkIcon = () => <Icon><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>
export const ImageIcon = () => <Icon><rect height="16" rx="2" width="18" x="3" y="4" /><path d="m3 16 5-5 4 4 3-3 6 6M15.5 8.5h.01" /></Icon>
export const VideoIcon = () => <Icon><rect height="12" rx="2" width="13" x="3" y="6" /><path d="m16 10 5-3v10l-5-3z" /></Icon>
export const RuleIcon = () => <Icon><path d="M4 12h16" /></Icon>
export const InlineCodeIcon = () => <Icon><path d="M9 7 5 12l4 5M15 7l4 5-4 5M13 6l-2 12" /></Icon>
export const CodeIcon = () => <Icon><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></Icon>
