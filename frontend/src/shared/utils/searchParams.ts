// The filters of a list live in the address (?keyword=...&status=...), so a filtered list can be shared and reloaded.

// The address of a filtered list built from the fields of a filter form. Empty fields are left out, and the page is not
// kept, so a new filter starts again at page 1.
export const readFilterFields = (fields: FormData, keys: readonly string[]): URLSearchParams => {
  const next = new URLSearchParams()
  for (const key of keys) {
    const value = String(fields.get(key) ?? '').trim()
    if (value) next.set(key, value)
  }
  return next
}

// The same filters on another page. Page 1 is the default, so it is not written in the address.
export const withPage = (params: URLSearchParams, page: number): URLSearchParams => {
  const next = new URLSearchParams(params)
  if (page > 1) next.set('page', String(page))
  else next.delete('page')
  return next
}

// The same filters with some values changed (an empty value removes the filter). By default the page goes back to 1.
export const withChanges = (params: URLSearchParams, changes: Record<string, string>, resetPage = true): URLSearchParams => {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  if (resetPage) next.delete('page')
  return next
}

// One value of the address, or '' when it is missing or not one of the allowed values.
export const readChoice = <T extends string>(value: string | null, allowed: readonly T[]): T | '' =>
  allowed.includes(value as T) ? (value as T) : ''
