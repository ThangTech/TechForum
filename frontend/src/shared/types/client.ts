export interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export interface ApiRequestInit extends RequestInit {
  // Login, register, refresh and logout must not send a Bearer token or retry after a 401.
  skipAuth?: boolean
}

// The session module registers these, so the client does not need to know where the token is kept.
export interface ApiAuthHandlers {
  // Resolves to the current access token. It waits while the first session restore is running.
  getAccessToken: () => Promise<string | null>
  // Gets a new access token with the refresh cookie. Resolves to null when the user is signed out.
  refreshAccessToken: () => Promise<string | null>
}
