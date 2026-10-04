import { Button } from '@astryxdesign/core/Button'
import { useState, type ChangeEvent } from 'react'
import { ApiError } from '../../api/client'
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
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-extrabold text-slate-950">Avatar</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <UserAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" />
        <label className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
          {isBusy ? 'Đang xử lý…' : 'Chọn ảnh'}
          <input accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={isBusy} onChange={(event) => void upload(event)} type="file" />
        </label>
        {avatarUrl && <Button isDisabled={isBusy} label="Xóa ảnh" onClick={() => void remove()} variant="secondary" />}
      </div>
      <p className="mt-3 text-xs text-slate-500">PNG, JPEG hoặc WebP; tối đa 2 MB. Nếu không có ảnh, TechForum dùng chữ cái đầu tên.</p>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </section>
  )
}
