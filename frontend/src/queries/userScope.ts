import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../auth/authStore'

// Query keys of user-specific data (notifications, own topics, admin pages, the helpful
// state of answers...) start with ['user', scope]. Public data (categories, topic lists)
// does not, so it stays in the cache when someone signs in or out.
export const userKey = (scope: string, ...parts: unknown[]) => ['user', scope, ...parts] as const

export const useUserScope = () => {
  const { userId, isAuthLoading } = useAuthStore(
    useShallow((state) => ({ userId: state.user?.id ?? null, isAuthLoading: state.isLoading })),
  )

  return {
    userId,
    scope: userId ?? 'guest',
    // False until the first attempt to restore the session has finished.
    // User-specific queries wait for it, so they never run under the wrong scope.
    isReady: !isAuthLoading,
    isSignedIn: userId !== null,
  }
}
