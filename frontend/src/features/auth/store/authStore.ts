import { create } from 'zustand'
import type { AuthSession, CurrentUser } from '../types/auth'

interface AuthState {
  user: CurrentUser | null
  // The access token is kept only in memory, never in localStorage, so a script cannot read it later.
  accessToken: string | null
  // Time (ms since 1970) when the access token expires.
  accessTokenExpiresAt: number | null
  // True until the first attempt to restore the session from the refresh cookie finishes.
  isLoading: boolean
  setSession: (session: AuthSession) => void
  setUser: (user: CurrentUser) => void
  clearSession: () => void
  finishLoading: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  isLoading: true,
  setSession: (session) =>
    set({
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresAt: Date.parse(session.accessTokenExpiresAtUtc),
    }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null, accessTokenExpiresAt: null }),
  finishLoading: () => set({ isLoading: false }),
}))
