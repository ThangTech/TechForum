import { ApiError, apiRequest } from '../../../shared/api/client'
import { hasPaging, isRecord } from '../../../shared/api/guards'
import type { AdminAccount, AdminAccountPage } from '../types/adminAccounts'

const isAdminAccount = (value: unknown): value is AdminAccount =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.displayName === 'string' &&
  typeof value.email === 'string' &&
  typeof value.createdAtUtc === 'string' &&
  typeof value.isLocked === 'boolean' &&
  typeof value.isAdministrator === 'boolean' &&
  (value.lockReason === null || typeof value.lockReason === 'string') &&
  (value.lockoutEndUtc === null || typeof value.lockoutEndUtc === 'string') &&
  typeof value.emailConfirmed === 'boolean' &&
  typeof value.topicCount === 'number' &&
  typeof value.answerCount === 'number' &&
  typeof value.violationCount === 'number'

const parseAccount = (data: unknown): AdminAccount => {
  if (!isAdminAccount(data)) throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  return data
}

export const getAdminAccounts = async (
  keyword: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
  status = '',
  role = '',
): Promise<AdminAccountPage> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (keyword) params.set('keyword', keyword)
  if (status) params.set('status', status)
  if (role) params.set('role', role)
  const data: unknown = await apiRequest(`/api/admin/accounts?${params.toString()}`, { signal })
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAdminAccount) ||
    !hasPaging(data)
  ) {
    throw new ApiError(500, 'Danh sách tài khoản từ API không đúng định dạng.')
  }
  return data as unknown as AdminAccountPage
}

export const setAccountLocked = async (
  userId: string,
  isLocked: boolean,
  reason: string | null = null,
  lockoutEndUtc: string | null = null,
): Promise<AdminAccount> =>
  parseAccount(
    await apiRequest(`/api/admin/accounts/${encodeURIComponent(userId)}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ isLocked, reason, lockoutEndUtc }),
    }),
  )

export const setAccountRole = async (userId: string, isAdministrator: boolean, reason: string): Promise<AdminAccount> =>
  parseAccount(
    await apiRequest(`/api/admin/accounts/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      body: JSON.stringify({ isAdministrator, reason }),
    }),
  )
