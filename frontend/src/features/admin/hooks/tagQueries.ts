import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdminTag, getAdminTags, setAdminTagActive, updateAdminTag } from '../api/adminTags'
import type { AdminTag, SaveTagInput } from '../types/adminTags'
import { adminKeys, useInvalidateAdminData, useAdminQueryState } from './adminKeys'
import { tagKeys } from '../../catalog/hooks/tags'

// The data of the admin page "tags".
export const useAdminTags = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.tags(scope),
    queryFn: ({ signal }) => getAdminTags(signal),
    enabled: isEnabled,
  })
}

// Creates a tag, or changes it when editingId is set.
export const useSaveAdminTag = (editingId: string | null) => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation<AdminTag, Error, SaveTagInput>({
    mutationFn: (input) => (editingId ? updateAdminTag(editingId, input) : createAdminTag(input)),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export const useToggleAdminTag = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (tag: AdminTag) => setAdminTagActive(tag.id, !tag.isActive),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}
