import { appRoutes } from '../../appRoutes'

export const adminLinks = [
  { to: appRoutes.adminOverview, label: 'Tổng quan' },
  { to: appRoutes.adminTopics, label: 'Nội dung' },
  { to: appRoutes.adminReports, label: 'Báo cáo' },
  { to: appRoutes.adminAccounts, label: 'Tài khoản' },
  { to: appRoutes.adminCategories, label: 'Chuyên mục' },
  { to: appRoutes.adminTags, label: 'Thẻ' },
  { to: appRoutes.adminAudit, label: 'Nhật ký' },
]
