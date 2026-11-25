import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useAnswerWrites } from '../hooks/answers'
import type { Answer } from '../types/answers'
import { ApiError } from '../../../shared/api/client'
import { useDiscardGuard } from '../../../shared/feedback/useDiscardGuard'
import { ProfanityNotice } from '../../moderation/components/ProfanityNotice'
import { useContentCheck } from '../../moderation/hooks/moderation'
import { useRichTextEditor } from '../../topics/hooks/useRichTextEditor'
import { AnswerEditor } from './AnswerEditor'

const answerLabels = { title: 'tiêu đề', summary: 'tóm tắt', bodyHtml: 'câu trả lời' }

export const AnswerEditDialog = ({ answer, onClose, onUpdated }: {
  answer: Answer
  onClose: () => void
  onUpdated: (answer: Answer) => void
}) => {
  const writes = useAnswerWrites()
  const [content, setContent] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null: chưa sửa gì (TipTap có thể đổi cách viết HTML cũ khi mở, không tính là đã sửa).
  const isDirty = content !== null
  const contentCheck = useContentCheck({ bodyHtml: content ?? answer.bodyHtml })
  const editor = useRichTextEditor({
    value: answer.bodyHtml,
    onChange: setContent,
    allowMedia: false,
    characterLimit: 20_000,
    label: 'Nội dung câu trả lời',
  })
  const { requestClose, discardDialog } = useDiscardGuard(isDirty, onClose)
  const closeIfIdle = () => {
    if (!isSaving) requestClose()
  }
  const save = async () => {
    if (!isDirty) { onClose(); return }
    if (!content?.trim() || editor.editor.isEmpty) { setError('Câu trả lời không được để trống.'); return }
    setIsSaving(true); setError(null)
    try { onUpdated(await writes.update(answer.topicId, answer.id, content)) }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể sửa câu trả lời.') }
    finally { setIsSaving(false) }
  }
  return (
    <>
    <Dialog open onClose={(_, reason) => { if (reason !== 'backdropClick') closeIfIdle() }} maxWidth={false} slotProps={{ paper: { 'aria-label': "Sửa câu trả lời", sx: { width: 680, maxWidth: 'calc(100% - 32px)' } } }}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0, color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Sửa câu trả lời</DialogTitle>
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <AnswerEditor editor={editor} />
        <ProfanityNotice labels={answerLabels} result={contentCheck.result} />
        {error && <Typography color="error" role="alert" sx={{ mt: 1.5 }} variant="body2">{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1.5 }}>
        <Button disabled={isSaving} onClick={closeIfIdle} variant="outlined">Hủy</Button>
        <Button disabled={isSaving} loading={isSaving} onClick={() => void save()} variant="contained">{isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
      </DialogActions>
    </Dialog>
    {discardDialog}
    </>
  )
}
