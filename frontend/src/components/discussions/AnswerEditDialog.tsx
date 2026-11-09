import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
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
    <Dialog open onClose={(_, reason) => { if (!isSaving && reason !== 'backdropClick') onClose() }} maxWidth={false} slotProps={{ paper: { 'aria-label': "Sửa câu trả lời", sx: { width: 560, maxWidth: 'calc(100% - 32px)' } } }}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0, color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Sửa câu trả lời</DialogTitle>
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <TextField
          disabled={isSaving}
          minRows={7}
          multiline
          onChange={(event) => setContent(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 20000, 'aria-label': 'Nội dung câu trả lời' } }}
          sx={{ mt: 1 }}
          value={content}
        />
        <Typography color="text.secondary" sx={{ mt: 1, textAlign: 'right', fontSize: '0.75rem' }}>{content.length.toLocaleString('vi-VN')}/20.000</Typography>
        {error && <Typography color="error" role="alert" sx={{ mt: 1.5 }} variant="body2">{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1.5 }}>
        <Button disabled={isSaving} onClick={onClose} variant="outlined">Hủy</Button>
        <Button disabled={isSaving} loading={isSaving} onClick={() => void save()} variant="contained">{isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
      </DialogActions>
    </Dialog>
  )
}
