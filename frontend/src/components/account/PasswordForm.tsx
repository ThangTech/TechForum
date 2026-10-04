import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'

interface PasswordFormProps {
  onSave: (currentPassword: string, newPassword: string) => Promise<void>
}

export const PasswordForm = ({ onSave }: PasswordFormProps) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setClientError(null)
    setMessage(null)
    if (newPassword !== confirmation) {
      setClientError('Mật khẩu xác nhận chưa khớp.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
      setMessage('Đã đổi mật khẩu. Phiên hiện tại vẫn được duy trì an toàn.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể đổi mật khẩu lúc này.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentPasswordError = getFieldError(error, 'currentPassword')
  const newPasswordError = getFieldError(error, 'newPassword')

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-6" onSubmit={handleSubmit} noValidate>
      <h2 className="text-xl font-extrabold text-slate-950">Đổi mật khẩu</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
      <div className="mt-5 grid gap-4">
        <TextInput autoComplete="current-password" isRequired label="Mật khẩu hiện tại" htmlName="currentPassword" onChange={setCurrentPassword} status={currentPasswordError ? { type: 'error', message: currentPasswordError } : undefined} type="password" value={currentPassword} width="100%" />
        <TextInput autoComplete="new-password" isRequired label="Mật khẩu mới" htmlName="newPassword" onChange={setNewPassword} status={newPasswordError ? { type: 'error', message: newPasswordError } : undefined} type="password" value={newPassword} width="100%" />
        <TextInput autoComplete="new-password" isRequired label="Xác nhận mật khẩu mới" htmlName="passwordConfirmation" onChange={setConfirmation} status={clientError ? { type: 'error', message: clientError } : undefined} type="password" value={confirmation} width="100%" />
      </div>
      {error && !currentPasswordError && !newPasswordError && <p className="mt-4 text-sm text-red-700" role="alert">{error.message}</p>}
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      <div className="mt-5">
        <Button isLoading={isSubmitting} label="Đổi mật khẩu" type="submit" variant="primary" />
      </div>
    </form>
  )
}
