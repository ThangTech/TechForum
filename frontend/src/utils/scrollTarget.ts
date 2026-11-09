// The id that a link like "/articles#topic-list" points to: "topic-list". Nothing when there is no target.
export const getHashTargetId = (hash: string): string | null => {
  if (!hash.startsWith('#') || hash.length < 2) return null
  const raw = hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    // A broken % sequence: use the text as it is.
    return raw
  }
}

// A box to type in is put in the middle of the screen (the search box lies in the header, at the very top);
// every other target is put at the top of the screen.
export const getScrollBlock = (tagName: string): 'center' | 'start' =>
  ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName.toUpperCase()) ? 'center' : 'start'
