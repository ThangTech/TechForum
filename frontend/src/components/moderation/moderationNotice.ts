import type { ContentCheckResult } from '../../api/moderation'

// The names of the three texts in a sentence. A form that has only one text gives its own words
// (an answer has only "nội dung").
export interface FieldLabels {
  title: string
  summary: string
  bodyHtml: string
}

export const defaultFieldLabels: FieldLabels = { title: 'tiêu đề', summary: 'tóm tắt', bodyHtml: 'nội dung' }

// The labels of the texts that the filter would change, in the order title, summary, body.
export const getChangedFieldLabels = (result: ContentCheckResult | undefined, labels: FieldLabels = defaultFieldLabels): string[] => {
  if (!result?.hasProfanity) return []
  const changed: string[] = []
  if (result.title !== null) changed.push(labels.title)
  if (result.summary !== null) changed.push(labels.summary)
  if (result.bodyHtml !== null) changed.push(labels.bodyHtml)
  return changed
}

// "tiêu đề", "tiêu đề và nội dung", "tiêu đề, tóm tắt và nội dung".
export const joinLabels = (labels: string[]): string => {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} và ${labels[labels.length - 1]}`
}

// The warning shown while writing, or null when there is nothing to warn about.
export const getNoticeText = (result: ContentCheckResult | undefined, labels: FieldLabels = defaultFieldLabels): string | null => {
  const changed = getChangedFieldLabels(result, labels)
  if (changed.length === 0) return null
  const name = joinLabels(changed)
  return `Phần ${name} có từ ngữ không phù hợp. Khi đăng, các từ đó sẽ tự động bị thay bằng ***. Bạn nên sửa lại cho phù hợp với cộng đồng.`
}
