import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../api/categories'

export const categoryKeys = {
  all: ['categories'] as const,
}

export const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => getCategories(signal),
  })
