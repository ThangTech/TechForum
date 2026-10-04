import { Button } from '@astryxdesign/core/Button'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/authState'
import { PasswordForm } from '../components/account/PasswordForm'
import { ProfileForm } from '../components/account/ProfileForm'

export const AccountPage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth()
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
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="eyebrow">Tài khoản cá nhân</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950">{user.displayName}</h1>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold text-slate-500">Email</dt><dd className="mt-1 text-slate-900">{user.email}</dd></div>
            <div><dt className="font-bold text-slate-500">Vai trò</dt><dd className="mt-1 text-slate-900">{user.roles.join(', ') || 'Thành viên'}</dd></div>
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileForm
            bio={user.bio}
            displayName={user.displayName}
            onSave={async (displayName, bio) => { await updateProfile({ displayName, bio }) }}
          />
          <PasswordForm onSave={async (currentPassword, newPassword) => { await changePassword({ currentPassword, newPassword }) }} />
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-extrabold text-slate-950">Phiên đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-600">Đăng xuất khỏi phiên hiện tại trên thiết bị này.</p>
          {error && <div className="form-alert mt-4" role="alert">{error}</div>}
          <div className="mt-5">
            <Button isLoading={isSubmitting} label="Đăng xuất" onClick={handleLogout} variant="secondary" />
          </div>
        </section>
      </div>
    </main>
  )
}
