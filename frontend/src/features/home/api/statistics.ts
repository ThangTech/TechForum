import { ApiError, apiRequest } from '../../../shared/api/client'
import type { PublicStatistics } from '../types/statistics'

export const getPublicStatistics = async (signal?: AbortSignal): Promise<PublicStatistics> => {
  const data = await apiRequest<unknown>('/api/statistics', { signal })
  const result = typeof data === 'object' && data !== null ? data as Record<string, unknown> : null
  if (!result || typeof result.memberCount !== 'number' || typeof result.articleCount !== 'number' ||
      typeof result.questionCount !== 'number') {
    throw new ApiError(500, 'Dữ liệu thống kê không đúng định dạng.')
  }
  return result as unknown as PublicStatistics
}
