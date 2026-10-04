import { Button } from '@astryxdesign/core/Button'
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
    <form className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" onSubmit={handleSubmit}>
      <label className="block text-sm font-bold text-slate-800" htmlFor={parentAnswer ? `reply-content-${parentAnswer.id}` : 'answer-content'}>
        {parentAnswer ? `Phản hồi ${parentAnswer.author.displayName}` : 'Câu trả lời của bạn'}
      </label>
      <textarea
        className="mt-3 min-h-36 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        disabled={isSubmitting}
        id={parentAnswer ? `reply-content-${parentAnswer.id}` : 'answer-content'}
        maxLength={20_000}
        onChange={(event) => setContent(event.target.value)}
        placeholder={parentAnswer ? 'Viết phản hồi rõ ràng và tôn trọng cộng đồng…' : 'Chia sẻ câu trả lời rõ ràng và tôn trọng cộng đồng…'}
        value={content}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{content.length.toLocaleString('vi-VN')}/20.000 ký tự</span>
        <div className="flex gap-2">
          {onCancel && <Button isDisabled={isSubmitting} label="Hủy" onClick={onCancel} type="button" variant="ghost" />}
          <Button
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            label={parentAnswer ? 'Gửi phản hồi' : 'Gửi câu trả lời'}
            type="submit"
            variant="primary"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </form>
  )
}
