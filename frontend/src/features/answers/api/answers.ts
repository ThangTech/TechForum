import { ApiError, apiRequest } from '../../../shared/api/client'

import { hasPaging, isRecord } from '../../../shared/api/guards'
import type { Answer, AnswerPage, AnswerSort } from '../types/answers'

const isAnswer = (value: unknown): value is Answer =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.topicId === 'string' &&
  (value.parentAnswerId === null || typeof value.parentAnswerId === 'string') &&
  (value.replyingTo === null || (isRecord(value.replyingTo) &&
    typeof value.replyingTo.id === 'string' && typeof value.replyingTo.displayName === 'string')) &&
  typeof value.bodyHtml === 'string' &&
  isRecord(value.author) &&
  typeof value.author.id === 'string' &&
  typeof value.author.displayName === 'string' &&
  typeof value.createdAtUtc === 'string' &&
  (value.updatedAtUtc === null || typeof value.updatedAtUtc === 'string') &&
  typeof value.isAccepted === 'boolean' &&
  typeof value.score === 'number' &&
  typeof value.myVote === 'number' &&
  typeof value.scoreHidden === 'boolean'

const parseAnswer = (data: unknown): Answer => {
  if (!isAnswer(data)) {
    throw new ApiError(500, 'Dữ liệu câu trả lời từ API không đúng định dạng.')
  }

  return data
}

export const getAnswers = async (
  topicId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
  aroundAnswerId?: string,
  sort: AnswerSort = 'oldest',
): Promise<AnswerPage> => {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort })
  if (aroundAnswerId !== undefined) query.set('aroundAnswerId', String(aroundAnswerId))
  const data: unknown = await apiRequest(
    `/api/topics/${topicId}/answers?${query}`,
    { signal },
  )

  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isAnswer) ||
    !hasPaging(data)
  ) {
    throw new ApiError(500, 'Danh sách câu trả lời từ API không đúng định dạng.')
  }

  return data as unknown as AnswerPage
}

export const createAnswer = async (topicId: string, bodyHtml: string, parentAnswerId?: string): Promise<Answer> =>
  parseAnswer(await apiRequest(`/api/topics/${topicId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ bodyHtml, parentAnswerId }),
  }))

export const acceptAnswer = async (topicId: string, answerId: string): Promise<Answer> =>
  parseAnswer(await apiRequest(`/api/topics/${topicId}/answers/${answerId}/accepted`, {
    method: 'PUT',
  }))

export const updateAnswer = async (topicId: string, answerId: string, bodyHtml: string): Promise<Answer> =>
  parseAnswer(await apiRequest(`/api/topics/${topicId}/answers/${answerId}`, {
    method: 'PUT',
    body: JSON.stringify({ bodyHtml }),
  }))

export const deleteAnswer = async (topicId: string, answerId: string): Promise<void> =>
  apiRequest(`/api/topics/${topicId}/answers/${answerId}`, { method: 'DELETE' })
