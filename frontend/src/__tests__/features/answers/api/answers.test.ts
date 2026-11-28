import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAnswers } from '../../../../features/answers/api/answers'
import { configureApiAuth } from '../../../../shared/api/client'

// Ids are GUIDs.
const topicId = '00000000-0000-0000-0000-000000000003'
const answerId = '00000000-0000-0000-0000-000000000042'

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

const answer = {
  id: answerId, topicId, parentAnswerId: null, replyingTo: null,
  bodyHtml: '<p>Giải thích</p>', author: { id: 'member', displayName: 'An' },
  createdAtUtc: '2026-10-21T00:00:00Z', updatedAtUtc: null,
  isAccepted: false, score: 3, myVote: 1, scoreHidden: false,
}

afterEach(() => {
  configureApiAuth(null)
  vi.unstubAllGlobals()
})

describe('answer pages', () => {
  it('keeps the requested sort and linked answer when fetching a page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      items: [answer],
      page: 2, pageSize: 20, totalItems: 25, totalPages: 2,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await getAnswers(topicId, 1, 20, undefined, answerId, 'score')

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.searchParams.get('sort')).toBe('score')
    expect(requestedUrl.searchParams.get('aroundAnswerId')).toBe(answerId)
    expect(page.items[0].myVote).toBe(1)
    expect(page.page).toBe(2)
  })

  it('rejects an answer without its vote score', async () => {
    const withoutScore: Record<string, unknown> = { ...answer }
    delete withoutScore.score
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      items: [withoutScore],
      page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
    })))

    await expect(getAnswers(topicId, 1, 20)).rejects.toMatchObject({ status: 500 })
  })
})
