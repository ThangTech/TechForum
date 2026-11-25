import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/client'
import { useAnswerWrites } from '../hooks/answers'
import type { Answer } from '../types/answers'
import { ProfanityNotice } from '../../moderation/components/ProfanityNotice'
import { useContentCheck } from '../../moderation/hooks/moderation'
import { useRichTextEditor } from '../../topics/hooks/useRichTextEditor'
import { AnswerEditor } from './AnswerEditor'

// An answer has only its content, so the warning calls it "câu trả lời".
const answerLabels = { title: 'tiêu đề', summary: 'tóm tắt', bodyHtml: 'câu trả lời' }

interface AnswerFormProps {
  parentAnswer?: Answer
  topicId: string
  onCreated: (answer: Answer) => void
  onCancel?: () => void
}

export const AnswerForm = ({ parentAnswer, topicId, onCreated, onCancel }: AnswerFormProps) => {
  const writes = useAnswerWrites()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contentCheck = useContentCheck({ bodyHtml: content })
  const label = parentAnswer ? `Phản hồi ${parentAnswer.author.displayName}` : 'Câu trả lời của bạn'
  const editor = useRichTextEditor({
    value: '',
    onChange: setContent,
    allowMedia: false,
    characterLimit: 20_000,
    label,
    placeholder: parentAnswer ? 'Viết phản hồi rõ ràng và tôn trọng cộng đồng…' : 'Chia sẻ câu trả lời rõ ràng và tôn trọng cộng đồng…',
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!content.trim() || editor.editor.isEmpty) {
      setError('Bạn chưa nhập nội dung trả lời.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const answer = await writes.create(topicId, content, parentAnswer?.id)
      editor.commands.clear()
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
      <Typography component="h3" sx={{ mb: 1.5, color: 'text.primary', fontSize: '0.875rem', fontWeight: 700 }}>{label}</Typography>
      <AnswerEditor editor={editor} />
      <Stack direction="row" sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
        <Stack direction="row" spacing={1}>
          {onCancel && <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="text">Hủy</Button>}
          <Button disabled={isSubmitting} loading={isSubmitting} type="submit" variant="contained">{parentAnswer ? 'Gửi phản hồi' : 'Gửi câu trả lời'}</Button>
        </Stack>
      </Stack>
      <ProfanityNotice labels={answerLabels} result={contentCheck.result} />
      {error && <Typography color="error" role="alert" sx={{ mt: 1.5 }} variant="body2">{error}</Typography>}
    </Box>
  )
}
