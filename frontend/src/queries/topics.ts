import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recordTopicShare, recordTopicView, type TopicEngagement } from '../api/engagements'
import {
  getFollowingTopics,
  getTopic,
  getTopics,
  type TopicDetail,
  type TopicFeedMode,
  type TopicFilters,
} from '../api/topics'
import { useUserScope, userKey } from './userScope'

export const topicKeys = {
  // Every public list of topics. Invalidate this after a topic is created, changed or deleted.
  lists: ['topics', 'list'] as const,
  list: (filters: TopicFilters) => ['topics', 'list', filters] as const,
  detail: (topicId: number) => ['topics', 'detail', topicId] as const,
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

// isValidId is false when the id in the URL is not a positive number; no request is sent then.
export const useTopic = (topicId: number, isValidId: boolean) =>
  useQuery({
    queryKey: topicKeys.detail(topicId),
    queryFn: ({ signal }) => getTopic(topicId, signal),
    enabled: isValidId,
  })

// The view and share counts are part of the topic, so the cached topic is updated with the new counts.
const updateEngagement = (
  queryClient: ReturnType<typeof useQueryClient>,
  topicId: number,
  engagement: TopicEngagement,
) => {
  queryClient.setQueryData<TopicDetail>(topicKeys.detail(topicId), (topic) =>
    topic ? { ...topic, ...engagement } : topic)
}

export const useRecordTopicView = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (topicId: number) => recordTopicView(topicId),
    onSuccess: (engagement, topicId) => updateEngagement(queryClient, topicId, engagement),
  })
}

export const useRecordTopicShare = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (topicId: number) => recordTopicShare(topicId),
    onSuccess: (engagement, topicId) => updateEngagement(queryClient, topicId, engagement),
  })
}
