import { ApiError, apiRequest } from './client'

// A word that the API replaces by "***" in posts and answers.
export interface BannedWord {
  id: number
  word: string
  createdAtUtc: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isBannedWord = (value: unknown): value is BannedWord =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.word === 'string' &&
  typeof value.createdAtUtc === 'string'

export const getBannedWords = async (signal?: AbortSignal): Promise<BannedWord[]> => {
  const data: unknown = await apiRequest('/api/admin/banned-words', { signal })
  if (!Array.isArray(data) || !data.every(isBannedWord)) {
    throw new ApiError(500, 'Danh sách từ cấm từ API không đúng định dạng.')
  }
  return data
}

export const addBannedWord = async (word: string): Promise<BannedWord> => {
  const data: unknown = await apiRequest('/api/admin/banned-words', {
    method: 'POST',
    body: JSON.stringify({ word }),
  })
  if (!isBannedWord(data)) throw new ApiError(500, 'Dữ liệu từ cấm từ API không đúng định dạng.')
  return data
}

export const removeBannedWord = (id: number) =>
  apiRequest<void>(`/api/admin/banned-words/${id}`, { method: 'DELETE' })
