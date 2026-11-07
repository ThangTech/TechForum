import { refreshSession } from '../api/auth'
import { ApiError, configureApiAuth } from '../api/client'
import { useAuthStore } from './authStore'

// Browser tabs share one refresh cookie. Only one tab at a time may use it,
// otherwise two tabs could send the same old token and look like a stolen token.
const REFRESH_LOCK_NAME = 'techforum-refresh-session'

// Ask for a new access token this long before the current one expires.
const REFRESH_MARGIN_MS = 60_000
const MIN_TIMER_DELAY_MS = 5_000

let isInitialized = false
let refreshInFlight: Promise<string | null> | null = null
let restorePromise: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | undefined

// Uses the refresh cookie to get a new access token.
// Returns null when the user is signed out or the server cannot be reached.
const requestNewSession = async (): Promise<string | null> => {
  try {
    const session = await refreshSession()
    useAuthStore.getState().setSession(session)
    return session.accessToken
  } catch (error) {
    // 401: the refresh token is missing, expired or revoked. 423: the account is locked.
    if (error instanceof ApiError && (error.status === 401 || error.status === 423)) {
      useAuthStore.getState().clearSession()
    }
    // A network error keeps the current session, so a short outage does not sign the user out.
    return null
  }
}

const runWithRefreshLock = <T>(task: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK_NAME, task)
  }

  return task()
}

// Many requests can fail with 401 together. They all wait for the same single refresh.
export const refreshAccessToken = (): Promise<string | null> => {
  refreshInFlight ??= runWithRefreshLock(requestNewSession).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

const isTokenExpiring = (expiresAt: number | null): boolean =>
  expiresAt !== null && expiresAt - Date.now() <= MIN_TIMER_DELAY_MS

const getAccessToken = async (): Promise<string | null> => {
  // Requests wait for the first restore, so a page reload does not send them as a guest.
  await restorePromise

  const { accessToken, accessTokenExpiresAt } = useAuthStore.getState()
  if (accessToken && isTokenExpiring(accessTokenExpiresAt)) {
    return refreshAccessToken()
  }

  return accessToken
}

const scheduleRefresh = (expiresAt: number | null) => {
  clearTimeout(refreshTimer)
  if (expiresAt === null) {
    return
  }

  const delay = Math.max(expiresAt - Date.now() - REFRESH_MARGIN_MS, MIN_TIMER_DELAY_MS)
  refreshTimer = setTimeout(() => {
    void refreshAccessToken()
  }, delay)
}

// Timers are slow in background tabs and stop while the computer sleeps.
const refreshWhenTabIsVisible = () => {
  const { accessToken, accessTokenExpiresAt } = useAuthStore.getState()
  const isStale = accessTokenExpiresAt !== null && accessTokenExpiresAt - Date.now() <= REFRESH_MARGIN_MS
  if (document.visibilityState === 'visible' && accessToken && isStale) {
    void refreshAccessToken()
  }
}

// Call once before the app renders. It connects the API client to the session
// and tries to restore the session from the refresh cookie.
export const initializeSession = () => {
  if (isInitialized) {
    return
  }
  isInitialized = true

  configureApiAuth({ getAccessToken, refreshAccessToken })
  useAuthStore.subscribe((state, previousState) => {
    if (state.accessTokenExpiresAt !== previousState.accessTokenExpiresAt) {
      scheduleRefresh(state.accessTokenExpiresAt)
    }
  })
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', refreshWhenTabIsVisible)
  }

  restorePromise = refreshAccessToken()
    .then(() => undefined)
    .finally(() => useAuthStore.getState().finishLoading())
}
