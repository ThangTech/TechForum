// One page of a list that is already loaded whole (the API gives every category and tag at once).
// A page number past the end shows the last page, so deleting the last item of a page never shows an empty page.
export const paginate = <T>(items: readonly T[], requestedPage: number, pageSize: number) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.max(1, Math.min(requestedPage, totalPages))
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages,
  }
}
