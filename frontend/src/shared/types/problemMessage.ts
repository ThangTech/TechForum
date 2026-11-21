// The sentence that a member reads when the API refuses a request. The API answers with a "problem" (title, detail and the
// errors of each field). ASP.NET writes some of these in English ("One or more validation errors occurred.", "Bad Request");
// those are never shown: the first Vietnamese sentence is used, then a sentence for the status code.

export interface ProblemLike {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}
