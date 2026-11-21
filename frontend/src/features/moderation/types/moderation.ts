// The texts that a member is writing. Any of them may be left out.
export interface ContentCheckInput {
  title?: string
  summary?: string
  bodyHtml?: string
}

// What the server filter would do to the texts. A text is only given when the filter changes it (it is then the text
// with the banned words replaced by "***"); null means "no change".
export interface ContentCheckResult {
  hasProfanity: boolean
  title: string | null
  summary: string | null
  bodyHtml: string | null
}
