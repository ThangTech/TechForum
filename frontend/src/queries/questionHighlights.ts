import { useQuery } from '@tanstack/react-query'
import { getQuestionHighlights } from '../api/questionHighlights'

export const questionHighlightKeys = {
  all: ['question-highlights'] as const,
}

export const useQuestionHighlights = () =>
  useQuery({
    queryKey: questionHighlightKeys.all,
    queryFn: ({ signal }) => getQuestionHighlights(signal),
  })
