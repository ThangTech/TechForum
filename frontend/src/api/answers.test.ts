import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAnswers, setAnswerHelpful } from './answers'

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

afterEach(() => vi.unstubAllGlobals())

describe('answer helpful votes', () => {
  it('keeps the requested sort and linked answer when fetching a page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      items: [{
        id: 42, topicId: 3, parentAnswerId: null, replyingTo: null,
        bodyHtml: '<p>Giải thích</p>', author: { id: 'member', displayName: 'An' },
        createdAtUtc: '2026-10-21T00:00:00Z', updatedAtUtc: null,
        isAccepted: false, helpfulCount: 8, isHelpful: true,
      }],
      page: 2, pageSize: 20, totalItems: 25, totalPages: 2,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await getAnswers(3, 1, 20, undefined, 42, 'helpful')

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.searchParams.get('sort')).toBe('helpful')
    expect(requestedUrl.searchParams.get('aroundAnswerId')).toBe('42')
    expect(page.items[0].isHelpful).toBe(true)
    expect(page.page).toBe(2)
  })

  it.each([true, false])('uses a protected idempotent write for helpful=%s', async (isHelpful) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'vote-csrf' }))
      .mockResolvedValueOnce(jsonResponse({ helpfulCount: isHelpful ? 1 : 0, isHelpful }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(setAnswerHelpful(3, 42, isHelpful)).resolves.toEqual({
      helpfulCount: isHelpful ? 1 : 0, isHelpful,
    })
    const [url, request] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toContain('/api/topics/3/answers/42/helpful')
    expect(request.method).toBe(isHelpful ? 'PUT' : 'DELETE')
    expect((request.headers as Headers).get('X-CSRF-TOKEN')).toBe('vote-csrf')
  })

  it('surfaces a self-vote rejection without inventing a local count', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'vote-csrf' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Bạn không thể tự đánh giá câu trả lời của mình.' }, 409)))

    await expect(setAnswerHelpful(3, 42, true)).rejects.toMatchObject({ status: 409 })
  })
})
