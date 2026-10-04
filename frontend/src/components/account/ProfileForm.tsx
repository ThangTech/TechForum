import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'

interface ProfileFormProps {
  displayName: string
  bio: string | null
  onSave: (displayName: string, bio: string | null) => Promise<void>
}

export const ProfileForm = ({ displayName, bio, onSave }: ProfileFormProps) => {
  const [value, setValue] = useState(displayName)
  const [bioValue, setBioValue] = useState(bio ?? '')
  const [error, setError] = useState<ApiError | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      await onSave(value, bioValue.trim() || null)
      setValue(value.trim())
      setBioValue(bioValue.trim())
      setMessage('Đã cập nhật tên hiển thị.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể cập nhật hồ sơ lúc này.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayNameError = getFieldError(error, 'displayName')

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-6" onSubmit={handleSubmit} noValidate>
      <h2 className="text-xl font-extrabold text-slate-950">Hồ sơ</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Tên này xuất hiện trên bài viết, câu trả lời và hồ sơ công khai.</p>
      <div className="mt-5">
        <TextInput
          autoComplete="name"
          isRequired
          label="Tên hiển thị"
          htmlName="displayName"
          onChange={setValue}
          status={displayNameError ? { type: 'error', message: displayNameError } : undefined}
          value={value}
          width="100%"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-bold text-slate-800" htmlFor="profile-bio">Giới thiệu công khai</label>
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          id="profile-bio"
          maxLength={500}
          onChange={(event) => setBioValue(event.target.value)}
          placeholder="Chia sẻ ngắn về kinh nghiệm và lĩnh vực bạn quan tâm."
          value={bioValue}
        />
        <p className="mt-1 text-right text-xs text-slate-500">{bioValue.length}/500</p>
      </div>
      {error && !displayNameError && <p className="mt-4 text-sm text-red-700" role="alert">{error.message}</p>}
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      <div className="mt-5">
        <Button isLoading={isSubmitting} label="Lưu hồ sơ" type="submit" variant="primary" />
      </div>
    </form>
  )
}
