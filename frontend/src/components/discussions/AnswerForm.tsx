import { Button } from '@astryxdesign/core/Button'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { createAnswer, type Answer } from '../../api/answers'

interface AnswerFormProps {
  topicId: number
  onCreated: (answer: Answer) => void
}

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const toParagraphHtml = (value: string) => value
  .trim()
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
  .join('')

export const AnswerForm = ({ topicId, onCreated }: AnswerFormProps) => {
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
      const answer = await createAnswer(topicId, toParagraphHtml(content))
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
      <label className="block text-sm font-bold text-slate-800" htmlFor="answer-content">
        Câu trả lời của bạn
      </label>
      <textarea
        className="mt-3 min-h-36 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        disabled={isSubmitting}
        id="answer-content"
        maxLength={20_000}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Chia sẻ câu trả lời rõ ràng và tôn trọng cộng đồng…"
        value={content}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{content.length.toLocaleString('vi-VN')}/20.000 ký tự</span>
        <Button
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          label="Gửi câu trả lời"
          type="submit"
          variant="primary"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </form>
  )
}
