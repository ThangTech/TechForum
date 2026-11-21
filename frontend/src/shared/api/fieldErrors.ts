import type { ApiError } from './client'

export const getFieldError = (error: ApiError | null, name: string) => {
  if (!error) return undefined
  const key = Object.keys(error.fieldErrors).find(
    (field) => field.toLowerCase() === name.toLowerCase(),
  )
  return key ? error.fieldErrors[key]?.join(' ') : undefined
}
