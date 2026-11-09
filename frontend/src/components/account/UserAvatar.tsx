import Avatar from '@mui/material/Avatar'
import { toMediaUrl } from '../../api/media'

interface UserAvatarProps {
  avatarUrl: string | null
  displayName: string
  size?: 'xs' | 'sm' | 'lg'
}

const avatarSizes = {
  xs: { size: 24, fontSize: '0.75rem' },
  sm: { size: 36, fontSize: '0.875rem' },
  lg: { size: 64, fontSize: '1.5rem' },
}

export const UserAvatar = ({ avatarUrl, displayName, size = 'sm' }: UserAvatarProps) => {
  const { size: pixels, fontSize } = avatarSizes[size]
  const fallback = displayName.slice(0, 1).toLocaleUpperCase('vi-VN')

  return avatarUrl ? (
    <Avatar
      alt={`Avatar của ${displayName}`}
      src={toMediaUrl(avatarUrl)}
      sx={{ width: pixels, height: pixels, flexShrink: 0, border: 1, borderColor: 'divider' }}
    />
  ) : (
    <Avatar aria-hidden="true" sx={{ width: pixels, height: pixels, flexShrink: 0, fontSize, fontWeight: 800, bgcolor: 'primary.light', color: 'primary.main' }}>
      {fallback}
    </Avatar>
  )
}
