import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import type { AdminTag, SaveTagInput } from '../../api/adminTags'
import { DialogFrame } from '../feedback/DialogFrame'

interface TagFormDialogProps {
  isBusy: boolean
  onClose: () => void
  onSubmit: (input: SaveTagInput) => void
  requestError: string | null
  tag: AdminTag | null
}

export const TagFormDialog = ({ isBusy, onClose, onSubmit, requestError, tag }: TagFormDialogProps) => {
  const [name, setName] = useState(tag?.name ?? '')
  const [slug, setSlug] = useState(tag?.slug ?? '')
  const [description, setDescription] = useState(tag?.description ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const close = () => {
    if (!isBusy) onClose()
  }

  const submit = () => {
    if (!name.trim() || !slug.trim()) {
      setValidationError('Tên và đường dẫn thẻ là bắt buộc.')
      return
    }
    setValidationError(null)
    onSubmit({ name: name.trim(), slug: slug.trim(), description: description.trim() || null })
  }

  return (
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={close} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={submit} variant="contained">{isBusy ? 'Đang lưu…' : 'Lưu thẻ'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={close}
      title={tag ? 'Sửa thẻ' : 'Tạo thẻ'}
      width={520}
    >
      <Stack spacing={2}>
        <TextField disabled={isBusy} id="tag-name" label="Tên thẻ" onChange={(event) => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} value={name} />
        <TextField disabled={isBusy} id="tag-slug" label="Đường dẫn" onChange={(event) => setSlug(event.target.value)} placeholder="react" slotProps={{ htmlInput: { maxLength: 60 } }} value={slug} />
        <TextField disabled={isBusy} id="tag-description" label="Mô tả" minRows={3} multiline onChange={(event) => setDescription(event.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} value={description} />
      </Stack>
    </DialogFrame>
  )
}
