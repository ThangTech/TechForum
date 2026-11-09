import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import type { AdminTag, SaveTagInput } from '../../api/adminTags'
import { isValidSlug, slugRuleMessage, toSlug } from '../../utils/slug'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'

const maxLength = 60

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
  // The address follows the name until the person types in the address box themselves.
  const [isSlugTyped, setIsSlugTyped] = useState(Boolean(tag?.slug))
  const [validationError, setValidationError] = useState<string | null>(null)
  const isDirty = name !== (tag?.name ?? '') || slug !== (tag?.slug ?? '') || description !== (tag?.description ?? '')
  const close = () => {
    if (!isBusy) onClose()
  }
  const { requestClose, discardDialog } = useDiscardGuard(isDirty, close)
  const closeIfIdle = () => {
    if (!isBusy) requestClose()
  }
  const isSlugInvalid = slug !== '' && !isValidSlug(slug, maxLength)

  const submit = () => {
    if (!name.trim() || !slug.trim()) {
      setValidationError('Tên và đường dẫn thẻ là bắt buộc.')
      return
    }
    if (!isValidSlug(slug.trim(), maxLength)) {
      setValidationError(`Đường dẫn không hợp lệ. ${slugRuleMessage}`)
      return
    }
    setValidationError(null)
    onSubmit({ name: name.trim(), slug: slug.trim(), description: description.trim() || null })
  }

  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={submit} variant="contained">{isBusy ? 'Đang lưu…' : 'Lưu thẻ'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={closeIfIdle}
      title={tag ? 'Sửa thẻ' : 'Tạo thẻ'}
      width={520}
    >
      <Stack spacing={2}>
        <TextField
          disabled={isBusy}
          id="tag-name"
          label="Tên thẻ"
          placeholder="Ví dụ: Spring Boot"
          onChange={(event) => {
            setName(event.target.value)
            if (!isSlugTyped) setSlug(toSlug(event.target.value, maxLength))
          }}
          slotProps={{ htmlInput: { maxLength } }}
          value={name}
        />
        <TextField
          disabled={isBusy}
          error={isSlugInvalid}
          helperText={isSlugInvalid ? slugRuleMessage : 'Tự điền theo tên thẻ, bạn có thể sửa lại.'}
          id="tag-slug"
          label="Đường dẫn"
          onChange={(event) => {
            setSlug(event.target.value)
            // Clearing the box gives the address back to the name.
            setIsSlugTyped(event.target.value !== '')
          }}
          placeholder="Ví dụ: spring-boot"
          slotProps={{ htmlInput: { maxLength } }}
          value={slug}
        />
        <TextField disabled={isBusy} id="tag-description" label="Mô tả" placeholder="Ví dụ: Framework Java để xây dựng ứng dụng backend nhanh" minRows={3} multiline onChange={(event) => setDescription(event.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} value={description} />
      </Stack>
    </DialogFrame>
    {discardDialog}
    </>
  )
}
