// True while a query is loading and has nothing to show yet. It stays true while the user
// presses "Thử lại" after an error, so the panel shows the loading text again.
export const isInitialLoading = (query: { isFetching: boolean; data: unknown }): boolean =>
  query.isFetching && query.data === undefined
