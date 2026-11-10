import { useQuery } from '@tanstack/react-query'
import { getRelatedTopics } from '../api/relatedTopics'

export const relatedTopicKeys = {
  forTopic: (topicId: string) => ['topics', 'related', topicId] as const,
}

export const useRelatedTopics = (topicId: string) =>
  useQuery({
    queryKey: relatedTopicKeys.forTopic(topicId),
    queryFn: ({ signal }) => getRelatedTopics(topicId, signal),
  })
