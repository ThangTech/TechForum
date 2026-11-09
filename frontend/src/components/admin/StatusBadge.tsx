import Chip from '@mui/material/Chip'
import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red'

// Màu nền nhạt và chữ đậm lấy từ palette của theme (src/theme/appTheme.ts), giống các nhãn trên trang công khai.
const toneColors: Record<BadgeTone, { background: string; color: string }> = {
  neutral: { background: 'var(--color-loading)', color: 'var(--color-muted)' },
  blue: { background: 'primary.light', color: 'primary.dark' },
  green: { background: 'success.light', color: 'success.main' },
  amber: { background: 'warning.light', color: 'warning.main' },
  red: { background: 'error.light', color: 'error.main' },
}

interface StatusBadgeProps {
  tone?: BadgeTone
  children: ReactNode
}

export const StatusBadge = ({ tone = 'neutral', children }: StatusBadgeProps) => (
  <Chip
    label={children}
    size="small"
    sx={{ bgcolor: toneColors[tone].background, color: toneColors[tone].color, fontWeight: 600, height: 24 }}
  />
)
