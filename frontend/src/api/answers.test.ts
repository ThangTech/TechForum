import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAnswers, setAnswerHelpful } from './answers'
import { configureApiAuth } from './client'

// Ids are GUIDs.
const topicId = '00000000-0000-0000-0000-000000000003'
const answerId = '00000000-0000-0000-0000-000000000042'

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

afterEach(() => {
  configureApiAuth(null)
  vi.unstubAllGlobals()
})

describe('answer helpful votes', () => {
  it('keeps the requested sort and linked answer when fetching a page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      items: [{
        id: answerId, topicId, parentAnswerId: null, replyingTo: null,
        bodyHtml: '<p>Giải thích</p>', author: { id: 'member', displayName: 'An' },
        createdAtUtc: '2026-10-21T00:00:00Z', updatedAtUtc: null,
        isAccepted: false, helpfulCount: 8, isHelpful: true, score: 3, myVote: 0, scoreHidden: false,
      }],
      page: 2, pageSize: 20, totalItems: 25, totalPages: 2,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await getAnswers(topicId, 1, 20, undefined, answerId, 'helpful')

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.searchParams.get('sort')).toBe('helpful')
    expect(requestedUrl.searchParams.get('aroundAnswerId')).toBe(answerId)
    expect(page.items[0].isHelpful).toBe(true)
    expect(page.page).toBe(2)
  })

  it.each([true, false])('uses a protected idempotent write for helpful=%s', async (isHelpful) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ helpfulCount: isHelpful ? 1 : 0, isHelpful }))
    vi.stubGlobal('fetch', fetchMock)
    configureApiAuth({ getAccessToken: async () => 'vote-access', refreshAccessToken: vi.fn() })

    await expect(setAnswerHelpful(topicId, answerId, isHelpful)).resolves.toEqual({
      helpfulCount: isHelpful ? 1 : 0, isHelpful,
    })
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(`/api/topics/${topicId}/answers/${answerId}/helpful`)
    expect(request.method).toBe(isHelpful ? 'PUT' : 'DELETE')
    expect((request.headers as Headers).get('Authorization')).toBe('Bearer vote-access')
  })

  it('surfaces a self-vote rejection without inventing a local count', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'Bạn không thể tự đánh giá câu trả lời của mình.' }, 409)))

    await expect(setAnswerHelpful(topicId, answerId, true)).rejects.toMatchObject({ status: 409 })
  })
})
