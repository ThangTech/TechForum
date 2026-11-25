import { useState } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { readChoice } from '../../../shared/utils/searchParams'
import type { AdminAccount } from '../types/adminAccounts'
import { useAuth } from '../../auth/hooks/authState'
import { useAdminAccounts, useSetAccountLocked, useSetAccountRole } from './accountQueries'

const PAGE_SIZE = 15
export const ACCOUNT_FILTER_KEYS = ['keyword', 'status', 'role'] as const

// Everything the admin page of accounts does: the filtered list and locking or unlocking an account with a reason.
export const useAdminAccountsPage = () => {
  const list = useListParams()
  const keyword = list.read('keyword')
  const status = readChoice(list.params.get('status'), ['locked', 'unlocked', 'unverified'] as const)
  const role = readChoice(list.params.get('role'), ['administrator', 'member'] as const)
  const feedback = useActionFeedback()
  const [selected, setSelected] = useState<AdminAccount | null>(null)
  const [roleTarget, setRoleTarget] = useState<AdminAccount | null>(null)
  const { user } = useAuth()
  const roleMutation = useSetAccountRole()

  const accountsQuery = useAdminAccounts({ keyword, page: list.page, pageSize: PAGE_SIZE, status, role })
  const lockMutation = useSetAccountLocked()
  const busyId = lockMutation.isPending
    ? lockMutation.variables.account.id
    : roleMutation.isPending ? roleMutation.variables.account.id : null

  const open = (account: AdminAccount) => {
    feedback.setError(null)
    setSelected(account)
  }

  const close = () => {
    feedback.setError(null)
    setSelected(null)
  }

  const confirm = async (reason: string | null, lockoutEndUtc: string | null) => {
    if (!selected || busyId) return
    // The list loads again after the change.
    const done = await feedback.run(() => lockMutation.mutateAsync({ account: selected, reason, lockoutEndUtc }), {
      success: (updated) => updated.isLocked ? 'Đã khóa tài khoản và lưu lý do xử lý.' : 'Đã mở khóa tài khoản.',
      failure: 'Không thể cập nhật tài khoản.',
    })
    if (done) setSelected(null)
  }

  const openRole = (account: AdminAccount) => {
    feedback.setError(null)
    setRoleTarget(account)
  }

  const closeRole = () => {
    feedback.setError(null)
    setRoleTarget(null)
  }

  const confirmRole = async (reason: string) => {
    if (!roleTarget || busyId) return
    const done = await feedback.run(() => roleMutation.mutateAsync({ account: roleTarget, reason }), {
      success: (updated) => updated.isAdministrator
        ? `Đã cấp quyền quản trị cho ${updated.displayName}.`
        : `Đã thu quyền quản trị của ${updated.displayName}.`,
      failure: 'Không thể đổi quyền tài khoản.',
    })
    if (done) setRoleTarget(null)
  }

  return {
    currentUserId: user?.id ?? null,
    filters: { keyword, status, role },
    submitFilters: list.submit,
    clearFilters: list.clear,
    changePage: list.changePage,
    data: accountsQuery.data ?? null,
    isLoading: isInitialLoading(accountsQuery),
    error: getErrorMessage(accountsQuery.error, 'Không thể tải danh sách tài khoản.'),
    retry: () => void accountsQuery.refetch(),
    busyId,
    // While the dialog is open, its error is shown inside it instead of above the list.
    feedback: { error: selected || roleTarget ? null : feedback.error, success: feedback.success },
    roleChange: { account: roleTarget, isBusy: busyId !== null, error: feedback.error, open: openRole, close: closeRole, confirm: confirmRole },
    lock: { account: selected, isBusy: busyId !== null, error: feedback.error, open, close, confirm },
  }
}
