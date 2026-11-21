import type { DraftStatus } from '../types/drafts'

// The form is saved this long after the last key press.
export const AUTO_SAVE_DELAY_MS = 3000

// The time of a draft (with the day when asked), as people read it in Vietnam.
export const formatDraftTime = (iso: string, withDate = false): string => {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return withDate ? `${time} ngày ${date.toLocaleDateString('vi-VN')}` : time
}

// The short text next to the buttons of the write form.
export const getDraftStatusText = (status: DraftStatus): string => {
  if (status.kind === 'saving') return 'Đang tự lưu…'
  if (status.kind === 'saved') return `Đã tự lưu lúc ${formatDraftTime(status.at)}`
  if (status.kind === 'error') return 'Chưa tự lưu được, sẽ thử lại khi bạn gõ tiếp'
  return ''
}
