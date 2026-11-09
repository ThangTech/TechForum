import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { getFieldError } from '../../api/fieldErrors'
import { FormTextField } from '../common/FormTextField'
import { Panel } from '../common/Panel'
import { useToast } from '../feedback/toastState'

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
  const { showToast } = useToast()
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileFormValues>({
    defaultValues: { displayName, bio: bio ?? '' },
  })
  const bioValue = useWatch({ control, name: 'bio' })

  const submitProfile = async (values: ProfileFormValues) => {
    setError(null)
    try {
      const trimmedBio = values.bio.trim()
      await onSave(values.displayName, trimmedBio || null)
      reset({ displayName: values.displayName.trim(), bio: trimmedBio })
      showToast('Đã lưu hồ sơ.')
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Không thể cập nhật hồ sơ lúc này.'))
    }
  }

  const displayNameError = getFieldError(error, 'displayName')

  return (
    <Panel component="form" noValidate onSubmit={handleSubmit(submitProfile)} sx={{ p: 3, overflow: 'visible' }}>
      <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Hồ sơ</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">Tên này xuất hiện trên bài viết, câu trả lời và hồ sơ công khai.</Typography>
      <Box sx={{ mt: 2.5 }}>
        <FormTextField
          autoComplete="name"
          control={control}
          label="Tên hiển thị"
          name="displayName"
          required
          rules={{ required: 'Vui lòng nhập tên hiển thị.' }}
          serverError={displayNameError}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
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
        <Typography color="text.secondary" sx={{ mt: 0.5, textAlign: 'right', fontSize: '0.75rem' }}>{bioValue.length}/500</Typography>
      </Box>
      {error && !displayNameError && <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{error.message}</Typography>}
      <Stack direction="row" sx={{ mt: 2.5 }}>
        <Button loading={isSubmitting} type="submit" variant="contained">Lưu hồ sơ</Button>
      </Stack>
    </Panel>
  )
}
