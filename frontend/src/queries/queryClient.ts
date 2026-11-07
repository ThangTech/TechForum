import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/authStore'

// Retry a failed read once when the server or the network failed. A 4xx answer
// (not found, no permission, invalid data) will not change by asking again.
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 1) {
    return false
  }

  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
  return !isClientError
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shared data such as categories does not need to be reloaded on every page change.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    },
    // Writes are never retried automatically, so a create request cannot make a duplicate.
    mutations: { retry: false },
  },
})

// Data that depends on the signed-in user is stored under ['user', userId, ...]
// (see userScope.ts). When the user signs out or another user signs in, the
// data of the previous user is removed so it can never be shown to someone else.
export const removeOtherUsersData = (currentUserId: string | undefined) => {
  const currentScope = currentUserId ?? 'guest'
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] !== currentScope,
  })
}

useAuthStore.subscribe((state, previousState) => {
  if (state.user?.id !== previousState.user?.id) {
    removeOtherUsersData(state.user?.id)
  }
})
