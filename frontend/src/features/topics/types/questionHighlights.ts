export interface QuestionHighlight {
  id: string
  title: string
  answerCount: number
  publishedAtUtc: string
}

export interface QuestionHighlights {
  latest: QuestionHighlight[]
  mostAnswered: QuestionHighlight[]
  periodDays: number
}
