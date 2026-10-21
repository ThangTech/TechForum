import type { AdminReport } from '../../api/reports'
export const reportReasonLabels: Record<AdminReport['reason'], string> = {
  spam: 'Spam / quảng cáo',
  harassment: 'Quấy rối / công kích',
  misinformation: 'Thông tin sai lệch',
  copyright: 'Vi phạm bản quyền',
  other: 'Lý do khác',
}
export const reportStatusLabels: Record<AdminReport['status'], string> = {
  pending: 'Chờ xử lý',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã bác bỏ',
}
