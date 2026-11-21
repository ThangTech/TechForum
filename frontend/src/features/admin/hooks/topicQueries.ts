import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminTopicDetail, getAdminTopics, moderateTopic } from '../api/adminTopics'
import type { ModerationAction } from '../types/adminTopics'
import { adminKeys, useInvalidateAdminData, type AdminTopicParams, useAdminQueryState } from './adminKeys'
import { statisticsKeys } from '../../home/hooks/statistics'
import { topicKeys } from '../../topics/hooks/topics'

// The data of the admin page "topics".
export const useAdminTopics = (params: AdminTopicParams) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.topics(scope, params),
    queryFn: ({ signal }) => getAdminTopics(params, signal),
    enabled: isEnabled,
  })
}

export const useAdminTopicDetail = (topicId: string) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.topicDetail(scope, topicId),
    queryFn: ({ signal }) => getAdminTopicDetail(topicId, signal),
    enabled: isEnabled,
  })
}

export const useModerateTopic = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: {
      topicId: string
      action: ModerationAction
      reason: string
      categoryId?: string
    }) => moderateTopic(input.topicId, input.action, input.reason, input.categoryId),
    onSuccess: () => {
      void invalidateAdminData()
      // Hiding, locking, pinning or moving a topic changes what everyone sees.
      void queryClient.invalidateQueries({ queryKey: topicKeys.all })
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all })
    },
  })
}
