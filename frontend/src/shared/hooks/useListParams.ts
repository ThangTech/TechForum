import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readFilterFields, withChanges, withPage } from '../utils/searchParams'
import { usePageParam } from './usePageParam'

// The filters and the page of a list, kept in the address. Every list page with a filter form uses it.
export const useListParams = () => {
  const [params, setParams] = useSearchParams()
  const page = usePageParam()

  // One filter of the address, trimmed ('' when it is missing).
  const read = (key: string) => params.get(key)?.trim() ?? ''

  // The values of a submitted filter form, as a new address (empty fields left out, back to page 1).
  const readForm = (event: FormEvent<HTMLFormElement>, keys: readonly string[]) => {
    event.preventDefault()
    return readFilterFields(new FormData(event.currentTarget), keys)
  }

  return {
    params,
    page,
    read,
    readForm,
    // Puts the given filters in the address.
    apply: (next: URLSearchParams) => setParams(next),
    // Submits a filter form: the filled fields become the new filters.
    submit: (event: FormEvent<HTMLFormElement>, keys: readonly string[]) => setParams(readForm(event, keys)),
    // Changes some filters and keeps the others.
    change: (changes: Record<string, string>, resetPage = true) => setParams(withChanges(params, changes, resetPage)),
    clear: () => setParams({}),
    changePage: (value: number) => setParams(withPage(params, value)),
  }
}
