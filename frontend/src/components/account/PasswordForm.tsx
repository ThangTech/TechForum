import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'
import { FormTextField } from '../common/FormTextField'
import { Panel } from '../common/Panel'

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
      setMessage('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể đổi mật khẩu lúc này.'))
    }
  }

  const currentPasswordError = getFieldError(error, 'currentPassword')
  const newPasswordError = getFieldError(error, 'newPassword')

  return (
    <Panel component="form" noValidate onSubmit={handleSubmit(submitPassword)} sx={{ p: 3, overflow: 'visible' }}>
      <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Đổi mật khẩu</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</Typography>
      <Stack spacing={2} sx={{ mt: 2.5 }}>
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
      </Stack>
      {error && !currentPasswordError && !newPasswordError && <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{error.message}</Typography>}
      {message && <Typography color="success" role="status" sx={{ mt: 2 }} variant="body2">{message}</Typography>}
      <Stack direction="row" sx={{ mt: 2.5 }}>
        <Button loading={isSubmitting} type="submit" variant="contained">Đổi mật khẩu</Button>
      </Stack>
    </Panel>
  )
}
