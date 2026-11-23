import { useEffect, useRef, useState } from 'react'
import type { GoogleButtonText } from '../types/google'
import { googleClientId, isGoogleSignInEnabled, loadGoogleIdentity } from '../utils/googleSignIn'

interface GoogleSignInButtonProps {
  text: GoogleButtonText
  onCredential: (credential: string) => void
}

// Nút do chính Google vẽ (bắt buộc theo quy định của Google). Không hiện gì khi chưa cấu hình Client ID.
export const GoogleSignInButton = ({ text, onCredential }: GoogleSignInButtonProps) => {
  const container = useRef<HTMLDivElement>(null)
  const latestCallback = useRef(onCredential)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    latestCallback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!isGoogleSignInEnabled) return

    let cancelled = false
    let observer: ResizeObserver | null = null
    loadGoogleIdentity()
      .then((google) => {
        const element = container.current
        if (cancelled || !element) return
        google.initialize({
          client_id: googleClientId,
          callback: (response) => latestCallback.current(response.credential),
        })

        // Cột form còn đổi độ rộng sau khi ảnh bên cạnh tải xong, nên vẽ lại nút mỗi khi khung đổi độ rộng.
        let renderedWidth = 0
        const render = () => {
          // Google chỉ nhận độ rộng từ 200 đến 400 px; trừ 2 px vì viền của nút làm nó rộng hơn số đã cho.
          const width = Math.min(400, Math.max(200, Math.floor(element.clientWidth) - 2))
          if (width === renderedWidth) return
          renderedWidth = width
          google.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text, shape: 'rectangular', width, locale: 'vi' })
        }
        render()
        observer = new ResizeObserver(render)
        observer.observe(element)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [text])

  if (!isGoogleSignInEnabled) return null

  return (
    <div className="auth-form__google">
      <div className="auth-form__divider"><span>hoặc</span></div>
      {failed
        ? <p className="auth-form__google-error" role="status">Không tải được đăng nhập Google. Hãy dùng email và mật khẩu.</p>
        : <div ref={container} className="auth-form__google-button" />}
    </div>
  )
}
