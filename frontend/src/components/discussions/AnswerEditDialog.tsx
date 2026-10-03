import { Button } from '@astryxdesign/core/Button'
import { Dialog } from '@astryxdesign/core/Dialog'
import { useState } from 'react'
import { updateAnswer, type Answer } from '../../api/answers'
import { ApiError } from '../../api/client'
import { toAnswerHtml, toAnswerText } from './answerContent'

export const AnswerEditDialog = ({ answer, onClose, onUpdated }: {
  answer: Answer
  onClose: () => void
  onUpdated: (answer: Answer) => void
}) => {
  const [content, setContent] = useState(() => toAnswerText(answer.bodyHtml))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    if (!content.trim()) { setError('Câu trả lời không được để trống.'); return }
    setIsSaving(true); setError(null)
    try { onUpdated(await updateAnswer(answer.topicId, answer.id, toAnswerHtml(content))) }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể sửa câu trả lời.') }
    finally { setIsSaving(false) }
  }
  return (
    <Dialog aria-label="Sửa câu trả lời" isOpen onOpenChange={(open) => !open && !isSaving && onClose()} padding={0} purpose="required" width={560}>
      <div className="p-6"><h2 className="text-xl font-extrabold text-slate-950">Sửa câu trả lời</h2>
        <textarea className="mt-5 min-h-44 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200" disabled={isSaving} maxLength={20000} onChange={(event) => setContent(event.target.value)} value={content} />
        <p className="mt-2 text-right text-xs text-slate-500">{content.length.toLocaleString('vi-VN')}/20.000</p>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><Button isDisabled={isSaving} label="Hủy" onClick={onClose} variant="secondary" /><Button isDisabled={isSaving} isLoading={isSaving} label={isSaving ? 'Đang lưu…' : 'Lưu thay đổi'} onClick={() => void save()} variant="primary" /></div>
      </div>
    </Dialog>
  )
}
