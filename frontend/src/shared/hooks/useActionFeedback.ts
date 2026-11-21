import { useState } from 'react'
import { ApiError } from '../api/client'

// The message of a failed action: the Vietnamese text of the API, or the given text for any other error.
export const getActionError = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback

interface RunOptions<T> {
  // Shown when the action works; it can use the answer of the API.
  success: string | ((result: T) => string)
  // Shown when the action fails without a message of the API.
  failure: string
  // Called after the error message is set, for example to reload a list.
  onError?: (error: unknown) => void
}

// The two messages above a list after the user does something on it (save, delete, lock...): one success text or
// one error text, never both. run() clears the old messages, does the action and sets the new one.
export const useActionFeedback = () => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clear = () => {
    setError(null)
    setSuccess(null)
  }

  // Resolves to true when the action worked.
  const run = async <T>(action: () => Promise<T>, options: RunOptions<T>): Promise<boolean> => {
    clear()
    try {
      const result = await action()
      setSuccess(typeof options.success === 'function' ? options.success(result) : options.success)
      return true
    } catch (requestError) {
      setError(getActionError(requestError, options.failure))
      options.onError?.(requestError)
      return false
    }
  }

  return { error, success, setError, clear, run }
}
