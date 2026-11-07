import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addBookmark, getBookmarkStatus, removeBookmark } from '../api/bookmarks'
import { topicKeys } from './topics'
import { useUserScope, userKey } from './userScope'

export const bookmarkKeys = {
  // Everything about the saved topics of one user: the list and the status of single topics.
  all: (scope: string) => userKey(scope, 'bookmarks'),
  status: (scope: string, topicId: number) => userKey(scope, 'topics', topicId, 'bookmark'),
}

export const useBookmarkStatus = (topicId: number) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: bookmarkKeys.status(scope, topicId),
    queryFn: ({ signal }) => getBookmarkStatus(topicId, signal),
    enabled: isReady,
  })
}

// Pass the current value of hasBookmark: true removes the bookmark, false adds it.
export const useToggleBookmark = (topicId: number) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (hasBookmark: boolean) =>
      hasBookmark ? removeBookmark(topicId) : addBookmark(topicId),
    onSuccess: (status) => {
      queryClient.setQueryData(bookmarkKeys.status(scope, topicId), status)
      // The list of saved topics changed, and topic lists show bookmark counts.
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.all(scope) })
      void queryClient.invalidateQueries({ queryKey: topicKeys.lists })
    },
  })
}
