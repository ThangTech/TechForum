import { ApiError, apiRequest } from './client'
import type { TopicType } from './topics'
import type { DraftSnapshot } from '../utils/draftSnapshot'

// The automatic draft of the write form. topicId is null for a new topic, or the id of the topic that is edited.
export interface Draft {
  id: string
  topicId: number | null
  title: string
  summary: string
  bodyHtml: string
  type: TopicType
  categoryId: number | null
  tagIds: number[]
  media: { id: string; path: string; contentType: string }[]
  updatedAtUtc: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseDraft = (data: unknown): Draft => {
  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    (data.topicId !== null && typeof data.topicId !== 'number') ||
    typeof data.title !== 'string' ||
    typeof data.summary !== 'string' ||
    typeof data.bodyHtml !== 'string' ||
    (data.type !== 'article' && data.type !== 'question') ||
    (data.categoryId !== null && typeof data.categoryId !== 'number') ||
    !Array.isArray(data.tagIds) ||
    !data.tagIds.every((tagId) => typeof tagId === 'number') ||
    !Array.isArray(data.media) ||
    !data.media.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.path === 'string' &&
      typeof item.contentType === 'string') ||
    typeof data.updatedAtUtc !== 'string'
  ) {
    throw new ApiError(500, 'Dữ liệu bản nháp từ API không đúng định dạng.')
  }
  return data as unknown as Draft
}

const targetQuery = (topicId: number | null): string => (topicId === null ? '' : `?topicId=${topicId}`)

// null when there is no draft (the API answers 204).
export const getDraft = async (topicId: number | null, signal?: AbortSignal): Promise<Draft | null> => {
  const data = await apiRequest<unknown>(`/api/drafts${targetQuery(topicId)}`, { signal })
  return data === undefined ? null : parseDraft(data)
}

export const saveDraft = async (topicId: number | null, snapshot: DraftSnapshot): Promise<Draft> =>
  parseDraft(await apiRequest('/api/drafts', {
    method: 'POST',
    body: JSON.stringify({ topicId, ...snapshot }),
  }))

export const deleteDraft = async (topicId: number | null): Promise<void> => {
  await apiRequest(`/api/drafts${targetQuery(topicId)}`, { method: 'DELETE' })
}
