import { ApiError, apiRequest } from './client'
import type { TopicAuthor } from './topics'

export interface Answer {
  id: number
  topicId: number
  bodyHtml: string
  author: TopicAuthor
  createdAtUtc: string
  updatedAtUtc: string | null
  isAccepted: boolean
}

export interface AnswerPage {
  items: Answer[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAnswer = (value: unknown): value is Answer =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.topicId === 'number' &&
  typeof value.bodyHtml === 'string' &&
  isRecord(value.author) &&
  typeof value.author.id === 'string' &&
  typeof value.author.displayName === 'string' &&
  typeof value.createdAtUtc === 'string' &&
  (value.updatedAtUtc === null || typeof value.updatedAtUtc === 'string') &&
  typeof value.isAccepted === 'boolean'

const parseAnswer = (data: unknown): Answer => {
  if (!isAnswer(data)) {
    throw new ApiError(500, 'Dữ liệu câu trả lời từ API không đúng định dạng.')
  }

  return data
}

export const getAnswers = async (
  topicId: number,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<AnswerPage> => {
  const data: unknown = await apiRequest(
    `/api/topics/${topicId}/answers?page=${page}&pageSize=${pageSize}`,
    { signal },
  )

  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAnswer) ||
    typeof data.page !== 'number' ||
    typeof data.pageSize !== 'number' ||
    typeof data.totalItems !== 'number' ||
    typeof data.totalPages !== 'number'
  ) {
    throw new ApiError(500, 'Danh sách câu trả lời từ API không đúng định dạng.')
  }

  return data as unknown as AnswerPage
}

export const createAnswer = async (topicId: number, bodyHtml: string): Promise<Answer> =>
  parseAnswer(await apiRequest(`/api/topics/${topicId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ bodyHtml }),
  }))

export const acceptAnswer = async (topicId: number, answerId: number): Promise<Answer> =>
  parseAnswer(await apiRequest(`/api/topics/${topicId}/answers/${answerId}/accepted`, {
    method: 'PUT',
  }))
