import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recordTopicShare, recordTopicView, type TopicEngagement } from '../api/engagements'
import {
  createTopic,
  deleteTopic,
  getFollowingTopics,
  getMyTopic,
  getMyTopics,
  getTopic,
  getTopics,
  updateTopic,
  type CreateTopicInput,
  type OwnTopic,
  type TopicDetail,
  type TopicFeedMode,
  type TopicFilters,
} from '../api/topics'
import { statisticsKeys } from './statistics'
import { useUserScope, userKey } from './userScope'

export const topicKeys = {
  // Everything public about topics: lists, details and related topics.
  all: ['topics'] as const,
  // Every public list of topics. Invalidate this after a topic is created, changed or deleted.
  lists: ['topics', 'list'] as const,
  list: (filters: TopicFilters) => ['topics', 'list', filters] as const,
  detail: (topicId: string) => ['topics', 'detail', topicId] as const,
}

// The topics written by the signed-in user, including drafts. They are stored per user.
export const ownTopicKeys = {
  all: (scope: string) => userKey(scope, 'topics', 'mine'),
  list: (scope: string, filters: TopicFilters) => [...ownTopicKeys.all(scope), 'list', filters] as const,
  detail: (scope: string, topicId: string) => [...ownTopicKeys.all(scope), 'detail', topicId] as const,
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
export const useTopic = (topicId: string, isValidId: boolean) =>
  useQuery({
    queryKey: topicKeys.detail(topicId),
    queryFn: ({ signal }) => getTopic(topicId, signal),
    enabled: isValidId,
  })

// The view and share counts are part of the topic, so the cached topic is updated with the new counts.
const updateEngagement = (
  queryClient: ReturnType<typeof useQueryClient>,
  topicId: string,
  engagement: TopicEngagement,
) => {
  queryClient.setQueryData<TopicDetail>(topicKeys.detail(topicId), (topic) =>
    topic ? { ...topic, ...engagement } : topic)
}

export const useRecordTopicView = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (topicId: string) => recordTopicView(topicId),
    onSuccess: (engagement, topicId) => updateEngagement(queryClient, topicId, engagement),
  })
}

export const useRecordTopicShare = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (topicId: string) => recordTopicShare(topicId),
    onSuccess: (engagement, topicId) => updateEngagement(queryClient, topicId, engagement),
  })
}

export const useMyTopics = (filters: TopicFilters) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: ownTopicKeys.list(scope, filters),
    queryFn: ({ signal }) => getMyTopics(filters, signal),
    enabled: isReady && isSignedIn,
  })
}

// Loads one own topic to edit it. The form copies the values once, so a reload in the
// background must not replace what the user typed: the data never becomes old, and it
// is dropped as soon as the page closes, so the next edit starts from the server's data.
export const useMyTopicForEdit = (topicId: string, isEditing: boolean) => {
  const { scope, isReady, isSignedIn } = useUserScope()

  return useQuery({
    queryKey: ownTopicKeys.detail(scope, topicId),
    queryFn: ({ signal }) => getMyTopic(topicId, signal),
    enabled: isEditing && isReady && isSignedIn,
    staleTime: Infinity,
    gcTime: 0,
  })
}

// Creates a topic, or changes it when editingId is set.
export const useSaveTopic = (editingId: string | null) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation<OwnTopic, Error, CreateTopicInput>({
    mutationFn: (input) => (editingId ? updateTopic(editingId, input) : createTopic(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownTopicKeys.all(scope) })
      void queryClient.invalidateQueries({ queryKey: topicKeys.lists })
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all })
      if (editingId) {
        void queryClient.invalidateQueries({ queryKey: topicKeys.detail(editingId) })
      }
    },
  })
}

export const useDeleteTopic = () => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (topicId: string) => deleteTopic(topicId),
    onSuccess: (_result, topicId) => {
      void queryClient.invalidateQueries({ queryKey: ownTopicKeys.all(scope) })
      void queryClient.invalidateQueries({ queryKey: topicKeys.lists })
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all })
      queryClient.removeQueries({ queryKey: topicKeys.detail(topicId) })
    },
  })
}
