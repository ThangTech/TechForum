import { Button } from '@astryxdesign/core/Button'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'

export const AccountPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    if (isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể đăng xuất lúc này.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="main-area account-page" id="main-content">
      <section className="account-card">
        <p className="eyebrow">Tài khoản cá nhân</p>
        <h1>{user.displayName}</h1>
        <dl>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Vai trò</dt><dd>{user.roles.join(', ') || 'Thành viên'}</dd></div>
        </dl>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <Button
          isLoading={isSubmitting}
          label="Đăng xuất"
          onClick={handleLogout}
          variant="secondary"
        />
      </section>
    </main>
  )
}
