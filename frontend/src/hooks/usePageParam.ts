import { useSearchParams } from 'react-router-dom'

// The largest page number the API accepts (a 32-bit number).
const maxPage = 2147483647

// The page number written in the address (?page=3). Anything that is not a whole number from 1 up gives page 1.
export const readPageParam = (value: string | null): number => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 && page <= maxPage ? page : 1
}

// The page of a list, read from the address. Every screen with a pager uses it, so they all treat a bad value the same way.
// The name is "page", or another name when one screen has two lists (the answers of a post use "answerPage").
export const usePageParam = (name = 'page'): number => {
  const [searchParams] = useSearchParams()
  return readPageParam(searchParams.get(name))
}
