// True when both lists hold the same ids, whatever their order. Used to know if the skills on the form differ
// from the saved ones (the Save button is only active when they do).
export const hasSameIds = (first: string[], second: string[]): boolean => {
  if (first.length !== second.length) return false
  const ids = new Set(second)
  return first.every((id) => ids.has(id))
}
