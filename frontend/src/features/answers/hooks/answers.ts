import { useQuery } from '@tanstack/react-query'
import { acceptAnswer, createAnswer, deleteAnswer, getAnswers, setAnswerHelpful, updateAnswer } from '../api/answers'
import type { AnswerSort } from '../types/answers'
import { useUserScope, userKey } from '../../auth/hooks/userScope'

export interface AnswerPageParams {
  page: number
  pageSize: number
  aroundAnswerId?: string
  sort: AnswerSort
}

export const answerKeys = {
  // Every page of the answers of one topic. The helpful state of an answer depends on
  // who is looking, so the answers are stored per user.
  all: (scope: string, topicId: string) => userKey(scope, 'topics', topicId, 'answers'),
  page: (scope: string, topicId: string, params: AnswerPageParams) =>
    [...answerKeys.all(scope, topicId), params] as const,
}

export const useAnswers = (topicId: string, params: AnswerPageParams) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: answerKeys.page(scope, topicId, params),
    queryFn: ({ signal }) =>
      getAnswers(topicId, params.page, params.pageSize, signal, params.aroundAnswerId, params.sort),
    enabled: isReady,
  })
}

// The writes of answers (post, edit, delete, helpful, accept). The components of the discussion keep their own busy
// and error states and update the list themselves, so the hook gives the calls as they are; a component never imports
// from api/.
export const useAnswerWrites = () => ({
  create: createAnswer,
  update: updateAnswer,
  remove: deleteAnswer,
  setHelpful: setAnswerHelpful,
  accept: acceptAnswer,
})
