// The time range of the admin dashboard. Days are written yyyy-mm-dd in the time zone of Vietnam.

// Today in Vietnam.
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

// The day that is count days before date.
export const daysBefore = (date: string, count: number) => {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - count)
  return value.toISOString().slice(0, 10)
}

// A day from the address, or the fallback when it is missing or not a real day.
export const readDate = (value: string | null, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) ? value : fallback

// Why a chosen range cannot be used, or null when it is fine. The API accepts at most 366 days.
export const getRangeError = (from: string, to: string): string | null => {
  if (from > to) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
  if ((new Date(to).getTime() - new Date(from).getTime()) / 86400000 > 365) return 'Vui lòng chọn tối đa 366 ngày.'
  return null
}

// 7 or 30 when the range is "the last 7 / 30 days up to today" (the quick buttons), otherwise null.
export const getQuickRange = (startDate: string, endDate: string, todayDate: string): 7 | 30 | null => {
  if (endDate !== todayDate) return null
  if (startDate === daysBefore(endDate, 6)) return 7
  if (startDate === daysBefore(endDate, 29)) return 30
  return null
}
