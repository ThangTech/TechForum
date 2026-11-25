import { useMutation, useQuery } from '@tanstack/react-query'
import { getAdminAccounts, setAccountLocked, setAccountRole } from '../api/adminAccounts'
import type { AdminAccount } from '../types/adminAccounts'
import { adminKeys, useInvalidateAdminData, type AdminAccountParams, useAdminQueryState } from './adminKeys'

// The data of the admin page "accounts".
export const useAdminAccounts = (params: AdminAccountParams) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.accounts(scope, params),
    queryFn: ({ signal }) =>
      getAdminAccounts(params.keyword, params.page, params.pageSize, signal, params.status, params.role),
    enabled: isEnabled,
  })
}

// Every administrator, for the filter of the audit log. It reads all pages of the list.
export const useAdministrators = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.administrators(scope),
    queryFn: async ({ signal }) => {
      const first = await getAdminAccounts('', 1, 50, signal, '', 'administrator')
      const administrators: AdminAccount[] = [...first.items]
      for (let nextPage = 2; nextPage <= first.totalPages; nextPage += 1) {
        const result = await getAdminAccounts('', nextPage, 50, signal, '', 'administrator')
        administrators.push(...result.items)
      }
      return administrators
    },
    enabled: isEnabled,
  })
}

export const useSetAccountLocked = () => {
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: {
      account: AdminAccount
      reason: string | null
      lockoutEndUtc: string | null
    }) => setAccountLocked(input.account.id, !input.account.isLocked, input.reason, input.lockoutEndUtc),
    onSuccess: () => invalidateAdminData(),
  })
}

export const useSetAccountRole = () => {
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: { account: AdminAccount; reason: string }) =>
      setAccountRole(input.account.id, !input.account.isAdministrator, input.reason),
    onSuccess: () => invalidateAdminData(),
  })
}
