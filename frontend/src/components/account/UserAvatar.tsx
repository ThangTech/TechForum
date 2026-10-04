import { apiBaseUrl } from '../../api/client'

interface UserAvatarProps {
  avatarUrl: string | null
  displayName: string
  size?: 'sm' | 'lg'
}

export const UserAvatar = ({ avatarUrl, displayName, size = 'sm' }: UserAvatarProps) => {
  const sizeClass = size === 'lg' ? 'size-16 text-2xl' : 'size-9 text-sm'
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
