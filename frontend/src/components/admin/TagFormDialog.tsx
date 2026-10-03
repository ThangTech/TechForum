import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState } from 'react'
import type { AdminTag, SaveTagInput } from '../../api/adminTags'

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
  const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200'

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
    <Dialog aria-label={tag ? 'Sửa thẻ' : 'Tạo thẻ'} isOpen onOpenChange={(open) => !open && close()} padding={0} purpose="required" width={520}>
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">{tag ? 'Sửa thẻ' : 'Tạo thẻ'}</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="tag-name">
            Tên thẻ
            <input className={inputClass} disabled={isBusy} id="tag-name" maxLength={60} onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="tag-slug">
            Đường dẫn
            <input className={inputClass} disabled={isBusy} id="tag-slug" maxLength={60} onChange={(event) => setSlug(event.target.value)} placeholder="react" value={slug} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="tag-description">
            Mô tả
            <textarea className={`${inputClass} min-h-24 resize-y`} disabled={isBusy} id="tag-description" maxLength={300} onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
        </div>
        {(validationError || requestError) && <p className="mt-4 text-sm text-red-700" role="alert">{validationError || requestError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button isDisabled={isBusy} label="Hủy" onClick={close} variant="secondary" />
          <Button isDisabled={isBusy} isLoading={isBusy} label={isBusy ? 'Đang lưu…' : 'Lưu thẻ'} onClick={submit} variant="primary" />
        </div>
      </div>
    </Dialog>
  )
}
