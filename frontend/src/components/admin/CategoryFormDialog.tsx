import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState } from 'react'
import type { AdminCategory, SaveCategoryInput } from '../../api/adminCategories'

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

  const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200'

  return (
    <Dialog
      aria-label={category ? 'Sửa chuyên mục' : 'Tạo chuyên mục'}
      isOpen
      onOpenChange={(open) => !open && close()}
      padding={0}
      purpose="required"
      width={520}
    >
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">{category ? 'Sửa chuyên mục' : 'Tạo chuyên mục'}</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="category-name">
            Tên chuyên mục
            <input className={inputClass} disabled={isBusy} id="category-name" maxLength={100} onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="category-slug">
            Đường dẫn
            <input className={inputClass} disabled={isBusy} id="category-slug" maxLength={100} onChange={(event) => setSlug(event.target.value)} placeholder="vi-du-chuyen-muc" value={slug} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="category-description">
            Mô tả
            <textarea className={`${inputClass} min-h-24 resize-y`} disabled={isBusy} id="category-description" maxLength={500} onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="category-order">
            Thứ tự hiển thị
            <input className={inputClass} disabled={isBusy} id="category-order" max={10000} min={0} onChange={(event) => setDisplayOrder(event.target.value)} type="number" value={displayOrder} />
          </label>
        </div>
        {(validationError || requestError) && <p className="mt-4 text-sm text-red-700" role="alert">{validationError || requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button isDisabled={isBusy} label="Hủy" onClick={close} variant="secondary" />
          <Button isDisabled={isBusy} isLoading={isBusy} label={isBusy ? 'Đang lưu…' : 'Lưu chuyên mục'} onClick={submit} variant="primary" />
        </div>
      </div>
    </Dialog>
  )
}
