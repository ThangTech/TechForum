import { useMutation, useQuery } from '@tanstack/react-query'
import { addBannedWord, getBannedWords, removeBannedWord } from '../api/adminBannedWords'
import { adminKeys, useInvalidateAdminData, useAdminQueryState } from './adminKeys'

// The data of the admin page "banned words".
export const useAdminBannedWords = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.bannedWords(scope),
    queryFn: ({ signal }) => getBannedWords(signal),
    enabled: isEnabled,
  })
}

export const useAddBannedWord = () => {
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (word: string) => addBannedWord(word),
    // The list and the audit log load again.
    onSuccess: () => { void invalidateAdminData() },
  })
}

export const useRemoveBannedWord = () => {
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (id: string) => removeBannedWord(id),
    onSuccess: () => { void invalidateAdminData() },
  })
}
