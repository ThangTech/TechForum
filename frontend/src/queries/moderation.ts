import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { checkContent, type ContentCheckInput } from '../api/moderation'
import { useDebounce } from '../hooks/useDebounce'
import { useUserScope } from './userScope'

// The member stopped typing for this long before the texts are sent to be checked.
const CHECK_DELAY_MS = 1000

// Asks the server which words of the texts being written would be replaced by "***". The request is sent after the
// typing stops and only for a signed-in member with some text. A failed check is ignored: it is only a hint.
// isCurrent is true when the answer is about the texts that are on the screen now (not about older ones).
export const useContentCheck = (input: ContentCheckInput) => {
  const { isReady, isSignedIn } = useUserScope()
  const title = input.title ?? ''
  const summary = input.summary ?? ''
  const bodyHtml = input.bodyHtml ?? ''
  const debouncedTitle = useDebounce(title, CHECK_DELAY_MS)
  const debouncedSummary = useDebounce(summary, CHECK_DELAY_MS)
  const debouncedBody = useDebounce(bodyHtml, CHECK_DELAY_MS)
  const hasText = [debouncedTitle, debouncedSummary, debouncedBody].some((text) => text.trim() !== '')

  const query = useQuery({
    queryKey: ['moderation', 'check', debouncedTitle, debouncedSummary, debouncedBody],
    queryFn: ({ signal }) => checkContent({ title: debouncedTitle, summary: debouncedSummary, bodyHtml: debouncedBody }, signal),
    enabled: isReady && isSignedIn && hasText,
    // The same texts give the same answer for a while; old versions of a long text must not pile up in memory.
    staleTime: 5 * 60_000,
    gcTime: 30_000,
    retry: false,
    placeholderData: keepPreviousData,
  })

  return {
    result: hasText ? query.data : undefined,
    isCurrent: title === debouncedTitle && summary === debouncedSummary && bodyHtml === debouncedBody,
  }
}
