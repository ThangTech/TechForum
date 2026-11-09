import { hasPreviewContent } from './previewContent'

// What the write form holds at one moment, in the shape that is sent to the API.
export interface DraftSnapshot {
  title: string
  summary: string
  bodyHtml: string
  type: 'article' | 'question'
  categoryId: number | null
  tagIds: number[]
  mediaIds: string[]
}

// Two snapshots with the same key hold the same text, so the second one does not need to be saved again.
// The order of tags and media does not change the meaning, so it does not change the key.
export const getSnapshotKey = (snapshot: DraftSnapshot): string => JSON.stringify({
  ...snapshot,
  tagIds: [...snapshot.tagIds].sort((a, b) => a - b),
  mediaIds: [...snapshot.mediaIds].sort(),
})

// Nothing typed yet. The API refuses to save such a draft, and there is nothing to lose.
export const isBlankSnapshot = (snapshot: DraftSnapshot): boolean =>
  snapshot.title.trim() === '' && snapshot.summary.trim() === '' && !hasPreviewContent(snapshot.bodyHtml)

// Whether the automatic draft must be written now. baselineKey is the key of the form when it was opened (the saved
// topic, or an empty form): a form that is back at that state has nothing to save.
export const shouldSaveDraft = (
  snapshot: DraftSnapshot,
  lastSavedKey: string,
  baselineKey: string,
): boolean => {
  const key = getSnapshotKey(snapshot)
  return key !== lastSavedKey && key !== baselineKey && !isBlankSnapshot(snapshot)
}

// Whether the draft that was saved earlier has to be removed: the member emptied the form or went back to the
// state at which it was opened, so the old draft would bring back text that was thrown away on purpose.
export const shouldRemoveDraft = (
  snapshot: DraftSnapshot,
  baselineKey: string,
  hasSavedDraft: boolean,
): boolean => hasSavedDraft && (isBlankSnapshot(snapshot) || getSnapshotKey(snapshot) === baselineKey)
