import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { createAnswer, type Answer } from '../../api/answers'
import { toAnswerHtml } from './answerContent'

interface AnswerFormProps {
  parentAnswer?: Answer
  topicId: number
  onCreated: (answer: Answer) => void
  onCancel?: () => void
}

export const AnswerForm = ({ parentAnswer, topicId, onCreated, onCancel }: AnswerFormProps) => {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fieldId = parentAnswer ? `reply-content-${parentAnswer.id}` : 'answer-content'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!content.trim()) {
      setError('Bạn chưa nhập nội dung trả lời.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const answer = await createAnswer(topicId, toAnswerHtml(content), parentAnswer?.id)
      setContent('')
      onCreated(answer)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể gửi câu trả lời lúc này.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: { xs: 2.5, sm: 3 }, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography component="label" htmlFor={fieldId} sx={{ display: 'block', color: 'text.primary', fontSize: '0.875rem', fontWeight: 700 }}>
        {parentAnswer ? `Phản hồi ${parentAnswer.author.displayName}` : 'Câu trả lời của bạn'}
      </Typography>
      <TextField
        disabled={isSubmitting}
        id={fieldId}
        minRows={6}
        multiline
        onChange={(event) => setContent(event.target.value)}
        placeholder={parentAnswer ? 'Viết phản hồi rõ ràng và tôn trọng cộng đồng…' : 'Chia sẻ câu trả lời rõ ràng và tôn trọng cộng đồng…'}
        slotProps={{ htmlInput: { maxLength: 20_000 } }}
        sx={{ mt: 1.5 }}
        value={content}
      />
      <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>{content.length.toLocaleString('vi-VN')}/20.000 ký tự</Typography>
        <Stack direction="row" spacing={1}>
          {onCancel && <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="text">Hủy</Button>}
          <Button disabled={isSubmitting} loading={isSubmitting} type="submit" variant="contained">{parentAnswer ? 'Gửi phản hồi' : 'Gửi câu trả lời'}</Button>
        </Stack>
      </Stack>
      {error && <Typography color="error" role="alert" sx={{ mt: 1.5 }} variant="body2">{error}</Typography>}
    </Box>
  )
}
