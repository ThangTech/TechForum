import Button from '@mui/material/Button'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'
import { FormTextField } from '../common/FormTextField'

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmation: string
}

interface PasswordFormProps {
  onSave: (currentPassword: string, newPassword: string) => Promise<void>
}

export const PasswordForm = ({ onSave }: PasswordFormProps) => {
  const [error, setError] = useState<ApiError | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmation: '' },
  })

  const submitPassword = async ({ currentPassword, newPassword }: PasswordFormValues) => {
    setError(null)
    setMessage(null)
    try {
      await onSave(currentPassword, newPassword)
      reset()
      setMessage('Đã đổi mật khẩu. Phiên hiện tại vẫn được duy trì an toàn.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể đổi mật khẩu lúc này.'))
    }
  }

  const currentPasswordError = getFieldError(error, 'currentPassword')
  const newPasswordError = getFieldError(error, 'newPassword')

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-6" onSubmit={handleSubmit(submitPassword)} noValidate>
      <h2 className="text-xl font-extrabold text-slate-950">Đổi mật khẩu</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
      <div className="mt-5 grid gap-4">
        <FormTextField
          autoComplete="current-password"
          control={control}
          label="Mật khẩu hiện tại"
          name="currentPassword"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu hiện tại.' }}
          serverError={currentPasswordError}
          type="password"
        />
        <FormTextField
          autoComplete="new-password"
          control={control}
          label="Mật khẩu mới"
          name="newPassword"
          required
          rules={{ required: 'Vui lòng nhập mật khẩu mới.' }}
          serverError={newPasswordError}
          type="password"
        />
        <FormTextField
          autoComplete="new-password"
          control={control}
          label="Xác nhận mật khẩu mới"
          name="confirmation"
          required
          rules={{
            required: 'Vui lòng nhập lại mật khẩu mới.',
            validate: (value, values) => value === values.newPassword || 'Mật khẩu xác nhận chưa khớp.',
          }}
          type="password"
        />
      </div>
      {error && !currentPasswordError && !newPasswordError && <p className="mt-4 text-sm text-red-700" role="alert">{error.message}</p>}
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      <div className="mt-5">
        <Button loading={isSubmitting} type="submit" variant="contained">Đổi mật khẩu</Button>
      </div>
    </form>
  )
}
