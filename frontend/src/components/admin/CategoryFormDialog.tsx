import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import type { AdminCategory, SaveCategoryInput } from '../../api/adminCategories'
import { isValidSlug, slugRuleMessage, toSlug } from '../../utils/slug'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'

const maxLength = 100

interface CategoryFormDialogProps {
  category: AdminCategory | null
  isBusy: boolean
  onClose: () => void
  onSubmit: (input: SaveCategoryInput) => void
  requestError: string | null
}

export const CategoryFormDialog = ({
  category,
  isBusy,
  onClose,
  onSubmit,
  requestError,
}: CategoryFormDialogProps) => {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [displayOrder, setDisplayOrder] = useState(String(category?.displayOrder ?? 0))
  // The address follows the name until the person types in the address box themselves.
  const [isSlugTyped, setIsSlugTyped] = useState(Boolean(category?.slug))
  const [validationError, setValidationError] = useState<string | null>(null)
  const isDirty = name !== (category?.name ?? '') || slug !== (category?.slug ?? '') ||
    description !== (category?.description ?? '') || displayOrder !== String(category?.displayOrder ?? 0)

  const close = () => {
    if (!isBusy) onClose()
  }
  const { requestClose, discardDialog } = useDiscardGuard(isDirty, close)
  const closeIfIdle = () => {
    if (!isBusy) requestClose()
  }
  const isSlugInvalid = slug !== '' && !isValidSlug(slug, maxLength)

  const submit = () => {
    const order = Number(displayOrder)
    if (!name.trim() || !slug.trim()) {
      setValidationError('Tên và đường dẫn chuyên mục là bắt buộc.')
      return
    }
    if (!isValidSlug(slug.trim(), maxLength)) {
      setValidationError(`Đường dẫn không hợp lệ. ${slugRuleMessage}`)
      return
    }
    if (!Number.isInteger(order) || order < 0 || order > 10_000) {
      setValidationError('Thứ tự hiển thị phải là số nguyên từ 0 đến 10.000.')
      return
    }
    setValidationError(null)
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      displayOrder: order,
    })
  }

  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={isBusy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={submit} variant="contained">{isBusy ? 'Đang lưu…' : 'Lưu chuyên mục'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={closeIfIdle}
      title={category ? 'Sửa chuyên mục' : 'Tạo chuyên mục'}
      width={520}
    >
      <Stack spacing={2}>
        <TextField
          disabled={isBusy}
          id="category-name"
          label="Tên chuyên mục"
          placeholder="Ví dụ: Trí tuệ nhân tạo"
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
          helperText={isSlugInvalid ? slugRuleMessage : 'Tự điền theo tên chuyên mục, bạn có thể sửa lại.'}
          id="category-slug"
          label="Đường dẫn"
          onChange={(event) => {
            setSlug(event.target.value)
            // Clearing the box gives the address back to the name.
            setIsSlugTyped(event.target.value !== '')
          }}
          placeholder="Ví dụ: tri-tue-nhan-tao"
          slotProps={{ htmlInput: { maxLength } }}
          value={slug}
        />
        <TextField disabled={isBusy} id="category-description" label="Mô tả" placeholder="Ví dụ: Học máy, mô hình ngôn ngữ và ứng dụng AI" minRows={3} multiline onChange={(event) => setDescription(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} value={description} />
        <TextField disabled={isBusy} helperText="Số nhỏ hiện trước, ví dụ 1, 2, 3." id="category-order" label="Thứ tự hiển thị" onChange={(event) => setDisplayOrder(event.target.value)} slotProps={{ htmlInput: { max: 10000, min: 0 } }} type="number" value={displayOrder} />
      </Stack>
    </DialogFrame>
    {discardDialog}
    </>
  )
}
