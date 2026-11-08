import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState, type ChangeEvent } from 'react'
import { ApiError } from '../../api/client'
import { Panel } from '../common/Panel'
import { UserAvatar } from './UserAvatar'

interface AvatarFormProps {
  avatarUrl: string | null
  displayName: string
  onDelete: () => Promise<unknown>
  onUpload: (file: File) => Promise<unknown>
}

export const AvatarForm = ({ avatarUrl, displayName, onDelete, onUpload }: AvatarFormProps) => {
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isBusy) return
    setIsBusy(true)
    setError(null)
    try { await onUpload(file) }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật avatar.') }
    finally { setIsBusy(false) }
  }

  const remove = async () => {
    if (isBusy) return
    setIsBusy(true)
    setError(null)
    try { await onDelete() }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể xóa avatar.') }
    finally { setIsBusy(false) }
  }

  return (
    <Panel component="section" sx={{ p: 3 }}>
      <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Avatar</Typography>
      <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <UserAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" />
        {/* The file input is hidden but still reachable with the keyboard; the button is the label of the input. */}
        <Button component="label" disabled={isBusy} variant="contained">
          {isBusy ? 'Đang xử lý…' : 'Chọn ảnh'}
          <Box accept="image/png,image/jpeg,image/webp" className="sr-only" component="input" disabled={isBusy} onChange={(event: ChangeEvent<HTMLInputElement>) => void upload(event)} type="file" />
        </Button>
        {avatarUrl && <Button disabled={isBusy} onClick={() => void remove()} variant="outlined">Xóa ảnh</Button>}
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '0.75rem' }}>PNG, JPEG hoặc WebP; tối đa 2 MB. Nếu không có ảnh, TechForum dùng chữ cái đầu tên.</Typography>
      {error && <Typography color="error" role="alert" sx={{ mt: 1.5 }} variant="body2">{error}</Typography>}
    </Panel>
  )
}
