import Alert from '@mui/material/Alert'
import type { ContentCheckResult } from '../../api/moderation'
import { defaultFieldLabels, getNoticeText, type FieldLabels } from './moderationNotice'

interface ProfanityNoticeProps {
  result: ContentCheckResult | undefined
  labels?: FieldLabels
}

// A warning under the text that a member is writing: which part has words that will be replaced by "***". It only
// advises; it never stops the member from posting (the server cleans the text anyway).
export const ProfanityNotice = ({ result, labels = defaultFieldLabels }: ProfanityNoticeProps) => {
  const text = getNoticeText(result, labels)
  if (!text) return null

  return <Alert role="status" severity="warning" sx={{ mt: 1.5, mb: 1.5 }}>{text}</Alert>
}
