// The text shown to the user for a failed query. API errors already have a Vietnamese message.
export const getErrorMessage = (
  error: unknown,
  fallback = 'Đã xảy ra lỗi không xác định.',
): string | null => {
  if (error === null || error === undefined) {
    return null
  }

  return error instanceof Error && error.message ? error.message : fallback
}
