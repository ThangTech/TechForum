// Small checks that every file of this folder uses on the data that comes back from the API, before the data is trusted.

// True for an object (not null), so its fields can be read and checked one by one.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// True when the data has the four numbers that every paged list of the API carries.
export const hasPaging = (data: Record<string, unknown>): boolean =>
  typeof data.page === 'number' &&
  typeof data.pageSize === 'number' &&
  typeof data.totalItems === 'number' &&
  typeof data.totalPages === 'number'
