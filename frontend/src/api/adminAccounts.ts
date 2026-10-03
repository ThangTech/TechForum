import { ApiError, apiRequest } from './client'

export interface AdminAccount {
  id: string
  displayName: string
  email: string
  createdAtUtc: string
  isLocked: boolean
  isAdministrator: boolean
}

export interface AdminAccountPage {
  items: AdminAccount[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAdminAccount = (value: unknown): value is AdminAccount =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.displayName === 'string' &&
  typeof value.email === 'string' &&
  typeof value.createdAtUtc === 'string' &&
  typeof value.isLocked === 'boolean' &&
  typeof value.isAdministrator === 'boolean'

const parseAccount = (data: unknown): AdminAccount => {
  if (!isAdminAccount(data)) throw new ApiError(500, 'Dữ liệu tài khoản từ API không đúng định dạng.')
  return data
}

export const getAdminAccounts = async (
  keyword: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<AdminAccountPage> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (keyword) params.set('keyword', keyword)
  const data: unknown = await apiRequest(`/api/admin/accounts?${params.toString()}`, { signal })
  if (
    !isRecord(data) || !Array.isArray(data.items) || !data.items.every(isAdminAccount) ||
    typeof data.page !== 'number' || typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' || typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Danh sách tài khoản từ API không đúng định dạng.')
  }
  return data as unknown as AdminAccountPage
}

export const setAccountLocked = async (userId: string, isLocked: boolean): Promise<AdminAccount> =>
  parseAccount(await apiRequest(`/api/admin/accounts/${encodeURIComponent(userId)}/lock`, {
    method: 'PUT',
    body: JSON.stringify({ isLocked }),
  }))
