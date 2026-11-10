import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTopicVote, setTopicVote } from '../api/votes'
import { useUserScope, userKey } from './userScope'

export const voteKeys = {
  // The vote of the member for a post depends on the member, so the key is user-scoped.
  topic: (scope: string, topicId: string) => userKey(scope, 'topics', topicId, 'vote'),
}

export const useTopicVote = (topicId: string) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: voteKeys.topic(scope, topicId),
    queryFn: ({ signal }) => getTopicVote(topicId, signal),
    enabled: isReady,
  })
}

// value: 1 = upvote, -1 = downvote, 0 = take the vote back.
export const useSetTopicVote = (topicId: string) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (value: number) => setTopicVote(topicId, value),
    onSuccess: (state) => queryClient.setQueryData(voteKeys.topic(scope, topicId), state),
  })
}
