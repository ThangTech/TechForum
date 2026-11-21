import { ApiError, apiRequest } from '../../../shared/api/client'

import type { DraftSnapshot } from '../utils/draftSnapshot'
import { isRecord } from '../../../shared/api/guards'
import type { Draft } from '../types/drafts'

const parseDraft = (data: unknown): Draft => {
  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    (data.topicId !== null && typeof data.topicId !== 'string') ||
    typeof data.title !== 'string' ||
    typeof data.summary !== 'string' ||
    typeof data.bodyHtml !== 'string' ||
    (data.type !== 'article' && data.type !== 'question') ||
    (data.categoryId !== null && typeof data.categoryId !== 'string') ||
    !Array.isArray(data.tagIds) ||
    !data.tagIds.every((tagId) => typeof tagId === 'string') ||
    !Array.isArray(data.media) ||
    !data.media.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.path === 'string' &&
      typeof item.contentType === 'string') ||
    typeof data.updatedAtUtc !== 'string'
  ) {
    throw new ApiError(500, 'Dữ liệu bản nháp từ API không đúng định dạng.')
  }
  return data as unknown as Draft
}

const targetQuery = (topicId: string | null): string => (topicId === null ? '' : `?topicId=${topicId}`)

// null when there is no draft (the API answers 204).
export const getDraft = async (topicId: string | null, signal?: AbortSignal): Promise<Draft | null> => {
  const data = await apiRequest<unknown>(`/api/drafts${targetQuery(topicId)}`, { signal })
  return data === undefined ? null : parseDraft(data)
}

export const saveDraft = async (topicId: string | null, snapshot: DraftSnapshot): Promise<Draft> =>
  parseDraft(await apiRequest('/api/drafts', {
    method: 'POST',
    body: JSON.stringify({ topicId, ...snapshot }),
  }))

export const deleteDraft = async (topicId: string | null): Promise<void> => {
  await apiRequest(`/api/drafts${targetQuery(topicId)}`, { method: 'DELETE' })
}
