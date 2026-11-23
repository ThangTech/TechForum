// Phần nhỏ của thư viện Google Identity Services mà trang dùng (https://accounts.google.com/gsi/client).
export interface GoogleCredentialResponse {
  credential: string
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  shape?: 'rectangular' | 'pill'
  width?: number
  locale?: string
}

export interface GoogleIdentityApi {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
}

export type GoogleButtonText = 'signin_with' | 'signup_with'

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } }
  }
}
