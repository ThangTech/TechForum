import { apiBaseUrl } from '../../api/client'

interface UserAvatarProps {
  avatarUrl: string | null
  displayName: string
  size?: 'xs' | 'sm' | 'lg'
}

const avatarSizeClasses = {
  xs: 'size-6 text-xs',
  sm: 'size-9 text-sm',
  lg: 'size-16 text-2xl',
}

export const UserAvatar = ({ avatarUrl, displayName, size = 'sm' }: UserAvatarProps) => {
  const sizeClass = avatarSizeClasses[size]
  const fallback = displayName.slice(0, 1).toLocaleUpperCase('vi-VN')

  return avatarUrl ? (
    <img
      alt={`Avatar của ${displayName}`}
      className={`${sizeClass} shrink-0 rounded-full border border-slate-200 object-cover`}
      src={`${apiBaseUrl}${avatarUrl}`}
    />
  ) : (
    <span className={`${sizeClass} grid shrink-0 place-items-center rounded-full bg-blue-100 font-extrabold text-blue-700`} aria-hidden="true">
      {fallback}
    </span>
  )
}
