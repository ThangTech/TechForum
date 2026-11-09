import { useEffect, useState } from 'react'

// The value after it stayed the same for delayMs. While the value keeps changing (the member keeps typing) the old
// one is returned, so work that depends on it, such as saving a draft, waits until the typing stops.
export const useDebounce = <T>(value: T, delayMs: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
