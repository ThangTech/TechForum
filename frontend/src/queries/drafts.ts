import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDraft, getDraft, saveDraft } from '../api/drafts'
import type { DraftSnapshot } from '../utils/draftSnapshot'
import { useUserScope, userKey } from './userScope'

export const draftKeys = {
  all: (scope: string) => userKey(scope, 'drafts'),
  target: (scope: string, topicId: number | null) => [...draftKeys.all(scope), topicId ?? 'new'] as const,
}

// Loads the draft of the form that is opening. It is read once, when the page opens: the form decides what to do with
// it (offer to restore it), and the draft that the form saves itself must not come back and replace what was typed.
export const useDraft = (topicId: number | null, isEnabled: boolean) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: draftKeys.target(scope, topicId),
    queryFn: ({ signal }) => getDraft(topicId, signal),
    enabled: isEnabled && isReady && isSignedIn,
    staleTime: Infinity,
    gcTime: 0,
    // A draft is a help, not a need: when it cannot be read the form opens without it.
    retry: false,
  })
}

export const useSaveDraft = (topicId: number | null) =>
  useMutation({
    mutationFn: (snapshot: DraftSnapshot) => saveDraft(topicId, snapshot),
  })

export const useDeleteDraft = (topicId: number | null) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: () => deleteDraft(topicId),
    onSuccess: () => queryClient.removeQueries({ queryKey: draftKeys.target(scope, topicId) }),
  })
}
