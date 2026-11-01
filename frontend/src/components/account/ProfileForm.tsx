import Button from '@mui/material/Button'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'
import { FormTextField } from '../common/FormTextField'

interface ProfileFormValues {
  displayName: string
  bio: string
}

interface ProfileFormProps {
  displayName: string
  bio: string | null
  onSave: (displayName: string, bio: string | null) => Promise<void>
}

export const ProfileForm = ({ displayName, bio, onSave }: ProfileFormProps) => {
  const [error, setError] = useState<ApiError | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileFormValues>({
    defaultValues: { displayName, bio: bio ?? '' },
  })
  const bioValue = useWatch({ control, name: 'bio' })

  const submitProfile = async (values: ProfileFormValues) => {
    setError(null)
    setMessage(null)
    try {
      const trimmedBio = values.bio.trim()
      await onSave(values.displayName, trimmedBio || null)
      reset({ displayName: values.displayName.trim(), bio: trimmedBio })
      setMessage('Đã cập nhật tên hiển thị.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể cập nhật hồ sơ lúc này.'))
    }
  }

  const displayNameError = getFieldError(error, 'displayName')

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-6" onSubmit={handleSubmit(submitProfile)} noValidate>
      <h2 className="text-xl font-extrabold text-slate-950">Hồ sơ</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Tên này xuất hiện trên bài viết, câu trả lời và hồ sơ công khai.</p>
      <div className="mt-5">
        <FormTextField
          autoComplete="name"
          control={control}
          label="Tên hiển thị"
          name="displayName"
          required
          rules={{ required: 'Vui lòng nhập tên hiển thị.' }}
          serverError={displayNameError}
        />
      </div>
      <div className="mt-4">
        <FormTextField
          control={control}
          id="profile-bio"
          label="Giới thiệu công khai"
          minRows={4}
          multiline
          name="bio"
          placeholder="Chia sẻ ngắn về kinh nghiệm và lĩnh vực bạn quan tâm."
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <p className="mt-1 text-right text-xs text-slate-500">{bioValue.length}/500</p>
      </div>
      {error && !displayNameError && <p className="mt-4 text-sm text-red-700" role="alert">{error.message}</p>}
      {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
      <div className="mt-5">
        <Button loading={isSubmitting} type="submit" variant="contained">Lưu hồ sơ</Button>
      </div>
    </form>
  )
}
