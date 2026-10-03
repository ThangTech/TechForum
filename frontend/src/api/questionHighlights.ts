import { ApiError, apiRequest } from './client'

export interface QuestionHighlight {
  id: number
  title: string
  answerCount: number
  publishedAtUtc: string
}

export interface QuestionHighlights {
  latest: QuestionHighlight[]
  mostAnswered: QuestionHighlight[]
  periodDays: number
}

const isHighlight = (value: unknown): value is QuestionHighlight => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'number' && typeof item.title === 'string' &&
    typeof item.answerCount === 'number' && typeof item.publishedAtUtc === 'string'
}

export const getQuestionHighlights = async (signal?: AbortSignal): Promise<QuestionHighlights> => {
  const data = await apiRequest<unknown>('/api/question-highlights?periodDays=30&limit=5', { signal })
  if (typeof data !== 'object' || data === null) throw new ApiError(500, 'Dữ liệu câu hỏi nổi bật không đúng định dạng.')
  const result = data as Record<string, unknown>
  if (!Array.isArray(result.latest) || !result.latest.every(isHighlight) ||
      !Array.isArray(result.mostAnswered) || !result.mostAnswered.every(isHighlight) ||
      typeof result.periodDays !== 'number') {
    throw new ApiError(500, 'Dữ liệu câu hỏi nổi bật không đúng định dạng.')
  }
  return result as unknown as QuestionHighlights
}
