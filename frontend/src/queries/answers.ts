import { useQuery } from '@tanstack/react-query'
import { getAnswers, type AnswerSort } from '../api/answers'
import { useUserScope, userKey } from './userScope'

export interface AnswerPageParams {
  page: number
  pageSize: number
  aroundAnswerId?: number
  sort: AnswerSort
}

export const answerKeys = {
  // Every page of the answers of one topic. The helpful state of an answer depends on
  // who is looking, so the answers are stored per user.
  all: (scope: string, topicId: number) => userKey(scope, 'topics', topicId, 'answers'),
  page: (scope: string, topicId: number, params: AnswerPageParams) =>
    [...answerKeys.all(scope, topicId), params] as const,
}

export const useAnswers = (topicId: number, params: AnswerPageParams) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: answerKeys.page(scope, topicId, params),
    queryFn: ({ signal }) =>
      getAnswers(topicId, params.page, params.pageSize, signal, params.aroundAnswerId, params.sort),
    enabled: isReady,
  })
}
