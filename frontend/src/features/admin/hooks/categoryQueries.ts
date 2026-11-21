import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdminCategory, getAdminCategories, setAdminCategoryActive, updateAdminCategory } from '../api/adminCategories'
import type { AdminCategory, SaveCategoryInput } from '../types/adminCategories'
import { adminKeys, useInvalidateAdminData, useAdminQueryState } from './adminKeys'
import { categoryKeys } from '../../catalog/hooks/categories'

// The data of the admin page "categories".
export const useAdminCategories = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.categories(scope),
    queryFn: ({ signal }) => getAdminCategories(signal),
    enabled: isEnabled,
  })
}

// Creates a category, or changes it when editingId is set.
export const useSaveAdminCategory = (editingId: string | null) => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation<AdminCategory, Error, SaveCategoryInput>({
    mutationFn: (input) =>
      editingId ? updateAdminCategory(editingId, input) : createAdminCategory(input),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export const useToggleAdminCategory = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (category: AdminCategory) => setAdminCategoryActive(category.id, !category.isActive),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
