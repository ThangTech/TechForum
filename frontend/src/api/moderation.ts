import { ApiError, apiRequest } from './client'

// The texts that a member is writing. Any of them may be left out.
export interface ContentCheckInput {
  title?: string
  summary?: string
  bodyHtml?: string
}

// What the server filter would do to the texts. A text is only given when the filter changes it (it is then the text
// with the banned words replaced by "***"); null means "no change".
export interface ContentCheckResult {
  hasProfanity: boolean
  title: string | null
  summary: string | null
  bodyHtml: string | null
}

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string'

const isContentCheckResult = (value: unknown): value is ContentCheckResult =>
  typeof value === 'object' && value !== null &&
  typeof (value as Record<string, unknown>).hasProfanity === 'boolean' &&
  isNullableString((value as Record<string, unknown>).title) &&
  isNullableString((value as Record<string, unknown>).summary) &&
  isNullableString((value as Record<string, unknown>).bodyHtml)

// The list of banned words stays on the server: the page only asks what would change.
export const checkContent = async (input: ContentCheckInput, signal?: AbortSignal): Promise<ContentCheckResult> => {
  const data: unknown = await apiRequest('/api/moderation/check', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  })
  if (!isContentCheckResult(data)) throw new ApiError(500, 'Kết quả kiểm tra nội dung không đúng định dạng.')
  return data
}
