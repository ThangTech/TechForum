import type { GoogleIdentityApi } from '../types/google'

const scriptUrl = 'https://accounts.google.com/gsi/client'

// Client ID không phải bí mật: Google công khai nó trong trang. Để trống thì không hiện nút Google.
export const googleClientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

export const isGoogleSignInEnabled = googleClientId.length > 0

let loading: Promise<GoogleIdentityApi> | null = null

// Tải thư viện của Google một lần cho cả trang, dù trang đăng nhập và đăng ký cùng cần nó.
export const loadGoogleIdentity = (): Promise<GoogleIdentityApi> => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id)
  }

  if (!loading) {
    loading = new Promise<GoogleIdentityApi>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.accounts?.id) resolve(window.google.accounts.id)
        else reject(new Error('Không tải được đăng nhập Google.'))
      }
      script.onerror = () => {
        // Cho phép thử lại ở lần sau (ví dụ mạng chập chờn).
        loading = null
        reject(new Error('Không tải được đăng nhập Google.'))
      }
      document.head.appendChild(script)
    })
  }

  return loading
}
