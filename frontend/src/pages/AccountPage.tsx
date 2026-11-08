import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { appRoutes } from '../appRoutes'
import { useAuth } from '../auth/authState'
import { PageShell } from '../components/common/PageShell'
import { Panel } from '../components/common/Panel'
import { PasswordForm } from '../components/account/PasswordForm'
import { ProfileForm } from '../components/account/ProfileForm'
import { AvatarForm } from '../components/account/AvatarForm'

const detailLabelSx = { color: 'text.secondary', fontWeight: 700 } as const
const detailValueSx = { mt: 0.5, ml: 0, color: 'var(--color-heading)' } as const

export const AccountPage = () => {
  const { user, updateProfile, changePassword, updateAvatar, deleteAvatar, logout } = useAuth()
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
    <PageShell compact maxWidth={1240}>
      <Panel component="section" sx={{ mb: 3, p: 3 }}>
        <p className="eyebrow">Tài khoản cá nhân</p>
        <Typography component="h1" sx={{ mt: 0.5, color: 'var(--color-heading)', fontSize: '1.875rem', fontWeight: 800 }}>{user.displayName}</Typography>
        <Box component="dl" sx={{ mt: 2.5, mb: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, fontSize: '0.875rem' }}>
          <div><Box component="dt" sx={detailLabelSx}>Email</Box><Box component="dd" sx={detailValueSx}>{user.email}</Box></div>
          <div><Box component="dt" sx={detailLabelSx}>Vai trò</Box><Box component="dd" sx={detailValueSx}>{user.roles.join(', ') || 'Thành viên'}</Box></div>
        </Box>
      </Panel>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <AvatarForm avatarUrl={user.avatarUrl} displayName={user.displayName} onDelete={deleteAvatar} onUpload={updateAvatar} />
        <ProfileForm
          bio={user.bio}
          displayName={user.displayName}
          onSave={async (displayName, bio) => { await updateProfile({ displayName, bio }) }}
        />
        <PasswordForm
          onSave={async (currentPassword, newPassword) => {
            await changePassword({ currentPassword, newPassword })
            // The server signed this account out on every device, so the user logs in again.
            navigate(appRoutes.login, {
              replace: true,
              state: { notice: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.' },
            })
          }}
        />
      </Box>

      <Panel component="section" sx={{ mt: 3, p: 3 }}>
        <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Phiên đăng nhập</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Đăng xuất khỏi phiên hiện tại trên thiết bị này.</Typography>
        {error && <Alert role="alert" severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2.5 }}>
          <Button loading={isSubmitting} onClick={handleLogout} variant="outlined">Đăng xuất</Button>
        </Box>
      </Panel>
    </PageShell>
  )
}
