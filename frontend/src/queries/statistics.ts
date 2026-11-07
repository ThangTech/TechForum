import { useQuery } from '@tanstack/react-query'
import { getPublicStatistics } from '../api/statistics'

export const statisticsKeys = {
  all: ['statistics'] as const,
}

export const usePublicStatistics = () =>
  useQuery({
    queryKey: statisticsKeys.all,
    queryFn: ({ signal }) => getPublicStatistics(signal),
  })
