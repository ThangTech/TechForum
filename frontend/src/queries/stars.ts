import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addTopicStar, getStarredTopics, getTopicStar, removeTopicStar } from '../api/stars'
import { topicKeys } from './topics'
import { useUserScope, userKey } from './userScope'

export const starKeys = {
  // The list of the posts the member gave a star to (it changes when a star is given or taken back).
  starred: (scope: string) => userKey(scope, 'starred'),
  starredPage: (scope: string, page: number, pageSize: number) => [...starKeys.starred(scope), { page, pageSize }] as const,
  // Whether the signed-in user gave a star depends on the user, so the key is user-scoped.
  status: (scope: string, topicId: number) => userKey(scope, 'topics', topicId, 'star'),
}

export const useTopicStar = (topicId: number) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: starKeys.status(scope, topicId),
    queryFn: ({ signal }) => getTopicStar(topicId, signal),
    enabled: isReady,
  })
}

// Pass the current value of hasStar: true removes the star, false adds it.
export const useToggleTopicStar = (topicId: number) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (hasStar: boolean) =>
      hasStar ? removeTopicStar(topicId) : addTopicStar(topicId),
    onSuccess: (status) => {
      queryClient.setQueryData(starKeys.status(scope, topicId), status)
      void queryClient.invalidateQueries({ queryKey: starKeys.starred(scope) })
      // Topic lists show the star count of every topic.
      void queryClient.invalidateQueries({ queryKey: topicKeys.lists })
    },
  })
}

export const useStarredTopics = (page: number, pageSize: number) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: starKeys.starredPage(scope, page, pageSize),
    queryFn: ({ signal }) => getStarredTopics(page, pageSize, signal),
    enabled: isReady && isSignedIn,
  })
}
