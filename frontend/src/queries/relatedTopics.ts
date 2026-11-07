import { useQuery } from '@tanstack/react-query'
import { getRelatedTopics } from '../api/relatedTopics'

export const relatedTopicKeys = {
  forTopic: (topicId: number) => ['topics', 'related', topicId] as const,
}

export const useRelatedTopics = (topicId: number) =>
  useQuery({
    queryKey: relatedTopicKeys.forTopic(topicId),
    queryFn: ({ signal }) => getRelatedTopics(topicId, signal),
  })
