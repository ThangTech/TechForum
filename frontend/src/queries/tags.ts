import { useQuery } from '@tanstack/react-query'
import { getTags } from '../api/tags'

export const tagKeys = {
  all: ['tags'] as const,
}

export const useTags = () =>
  useQuery({
    queryKey: tagKeys.all,
    queryFn: ({ signal }) => getTags(signal),
  })
