import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import type { AdminCategory, SaveCategoryInput } from '../../api/adminCategories'
import { AdminDialog } from './AdminDialog'

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
  const [validationError, setValidationError] = useState<string | null>(null)

  const close = () => {
    if (!isBusy) onClose()
  }

  const submit = () => {
    const order = Number(displayOrder)
    if (!name.trim() || !slug.trim()) {
      setValidationError('Tên và đường dẫn chuyên mục là bắt buộc.')
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
    <AdminDialog
      actions={
        <>
          <Button disabled={isBusy} onClick={close} variant="outlined">Hủy</Button>
          <Button disabled={isBusy} loading={isBusy} onClick={submit} variant="contained">{isBusy ? 'Đang lưu…' : 'Lưu chuyên mục'}</Button>
        </>
      }
      error={validationError || requestError}
      onClose={close}
      title={category ? 'Sửa chuyên mục' : 'Tạo chuyên mục'}
      width={520}
    >
      <Stack spacing={2}>
        <TextField disabled={isBusy} id="category-name" label="Tên chuyên mục" onChange={(event) => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} value={name} />
        <TextField disabled={isBusy} id="category-slug" label="Đường dẫn" onChange={(event) => setSlug(event.target.value)} placeholder="vi-du-chuyen-muc" slotProps={{ htmlInput: { maxLength: 100 } }} value={slug} />
        <TextField disabled={isBusy} id="category-description" label="Mô tả" minRows={3} multiline onChange={(event) => setDescription(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} value={description} />
        <TextField disabled={isBusy} id="category-order" label="Thứ tự hiển thị" onChange={(event) => setDisplayOrder(event.target.value)} slotProps={{ htmlInput: { max: 10000, min: 0 } }} type="number" value={displayOrder} />
      </Stack>
    </AdminDialog>
  )
}
