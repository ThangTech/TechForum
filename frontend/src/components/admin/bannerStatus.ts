import type { AdminBanner } from '../../api/adminBanners'
import type { BadgeTone } from './StatusBadge'

// What an administrator should read about a banner: is it on the home page right now?
export const getBannerStatus = (banner: AdminBanner, now = Date.now()): { label: string; tone: BadgeTone } => {
  if (!banner.isActive) return { label: 'Đã tắt', tone: 'neutral' }
  if (banner.startsAtUtc && new Date(banner.startsAtUtc).getTime() > now) return { label: 'Chờ hiển thị', tone: 'amber' }
  if (banner.endsAtUtc && new Date(banner.endsAtUtc).getTime() <= now) return { label: 'Đã hết hạn', tone: 'red' }
  return { label: 'Đang hiển thị', tone: 'green' }
}

// "2026-11-09T14:30" is what a datetime-local field needs; the server keeps UTC times.
export const toLocalInputValue = (iso: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const fromLocalInputValue = (value: string): string | null => (value ? new Date(value).toISOString() : null)
