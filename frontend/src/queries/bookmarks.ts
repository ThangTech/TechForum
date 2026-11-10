import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addBookmark, getBookmarkStatus, getSavedTopics, removeBookmark } from '../api/bookmarks'
import { topicKeys } from './topics'
import { useUserScope, userKey } from './userScope'

export const bookmarkKeys = {
  // Everything about the saved topics of one user: the list and the status of single topics.
  all: (scope: string) => userKey(scope, 'bookmarks'),
  status: (scope: string, topicId: string) => userKey(scope, 'topics', topicId, 'bookmark'),
  list: (scope: string, page: number, pageSize: number) =>
    [...bookmarkKeys.all(scope), 'list', { page, pageSize }] as const,
}

export const useBookmarkStatus = (topicId: string) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: bookmarkKeys.status(scope, topicId),
    queryFn: ({ signal }) => getBookmarkStatus(topicId, signal),
    enabled: isReady,
  })
}

// Pass the current value of hasBookmark: true removes the bookmark, false adds it.
export const useToggleBookmark = (topicId: string) => {
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

export const useSavedTopics = (page: number, pageSize: number) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: bookmarkKeys.list(scope, page, pageSize),
    queryFn: ({ signal }) => getSavedTopics(page, pageSize, signal),
    enabled: isReady && isSignedIn,
  })
}
