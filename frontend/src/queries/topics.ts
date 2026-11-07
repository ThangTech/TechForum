import { useQuery } from '@tanstack/react-query'
import {
  getFollowingTopics,
  getTopics,
  type TopicFeedMode,
  type TopicFilters,
} from '../api/topics'
import { useUserScope, userKey } from './userScope'

export const topicKeys = {
  // Every public list of topics. Invalidate this after a topic is created, changed or deleted.
  lists: ['topics', 'list'] as const,
  list: (filters: TopicFilters) => ['topics', 'list', filters] as const,
}

// The home feed. "Following" depends on who is signed in, so it is stored per user
// and only runs when a user is signed in.
export const useTopicFeed = (feed: TopicFeedMode, filters: TopicFilters) => {
  const { scope, isReady, isSignedIn } = useUserScope()
  const isFollowing = feed === 'following'

  return useQuery({
    queryKey: isFollowing
      ? userKey(scope, 'topics', 'following', filters)
      : topicKeys.list(filters),
    queryFn: ({ signal }) =>
      isFollowing ? getFollowingTopics(filters, signal) : getTopics(filters, signal),
    enabled: !isFollowing || (isReady && isSignedIn),
  })
}
