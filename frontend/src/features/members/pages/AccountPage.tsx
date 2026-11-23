import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAccountPage } from '../hooks/useAccountPage'
import { PageShell } from '../../../shared/components/PageShell'
import { Panel } from '../../../shared/components/Panel'
import { PasswordForm } from '../components/PasswordForm'
import { ProfileForm } from '../components/ProfileForm'
import { AvatarForm } from '../components/AvatarForm'
import { SkillsForm } from '../components/SkillsForm'

const detailLabelSx = { color: 'text.secondary', fontWeight: 700 } as const
const detailValueSx = { mt: 0.5, ml: 0, color: 'var(--color-heading)' } as const

export const AccountPage = () => {
  const view = useAccountPage()
  const { user, logout } = view

  if (!user) return null

  return (
    <PageShell compact maxWidth={1240}>
      <Panel component="section" sx={{ mb: 3, p: 3 }}>
        <p className="eyebrow">Tài khoản cá nhân</p>
        <Typography component="h1" sx={{ mt: 0.5, color: 'var(--color-heading)', fontSize: '1.875rem', fontWeight: 800 }}>{user.displayName}</Typography>
        <Box component="dl" sx={{ mt: 2.5, mb: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, fontSize: '0.875rem' }}>
          <div><Box component="dt" sx={detailLabelSx}>Email</Box><Box component="dd" sx={detailValueSx}>{user.email}</Box></div>
          <div><Box component="dt" sx={detailLabelSx}>Vai trò</Box><Box component="dd" sx={detailValueSx}>{user.roles.join(', ') || 'Thành viên'}</Box></div>
          <div><Box component="dt" sx={detailLabelSx}>Đăng nhập bằng</Box><Box component="dd" sx={detailValueSx}>{view.signInMethods}</Box></div>
        </Box>
      </Panel>

      {/* Two columns that do not depend on each other: a short card is not stretched to the height of its neighbour,
          and the sign-in session sits under the other cards of the right column, where there was empty space. */}
      <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Stack spacing={3}>
          <AvatarForm avatarUrl={user.avatarUrl} displayName={user.displayName} onDelete={view.deleteAvatar} onUpload={view.uploadAvatar} />
          <ProfileForm
            bio={user.bio}
            displayName={user.displayName}
            onSave={view.saveProfile}
          />
        </Stack>

        <Stack spacing={3}>
          <SkillsForm />
          <PasswordForm hasPassword={view.hasPassword} onSave={view.savePassword} />
          <Panel component="section" sx={{ p: 3 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Phiên đăng nhập</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">Đăng xuất khỏi phiên hiện tại trên thiết bị này.</Typography>
              </Box>
              <Button loading={logout.isBusy} onClick={() => void logout.run()} variant="outlined">Đăng xuất</Button>
            </Stack>
            {logout.error && <Alert role="alert" severity="error" sx={{ mt: 2 }}>{logout.error}</Alert>}
          </Panel>
        </Stack>
      </Box>
    </PageShell>
  )
}
