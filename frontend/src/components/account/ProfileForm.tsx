import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'

interface ProfileFormProps {
  displayName: string
  onSave: (displayName: string) => Promise<void>
}

export const ProfileForm = ({ displayName, onSave }: ProfileFormProps) => {
  const [value, setValue] = useState(displayName)
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
      await onSave(value)
      setValue(value.trim())
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
      {error && !displayNameError && <p className="mt-4 text-sm text-red-700" role="alert">{error.message}</p>}
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      <div className="mt-5">
        <Button isLoading={isSubmitting} label="Lưu hồ sơ" type="submit" variant="primary" />
      </div>
    </form>
  )
}
