import { describe, expect, it } from 'vitest'
import { paginate } from '../../../shared/utils/paginate'

const items = Array.from({ length: 23 }, (_, index) => index + 1)

describe('paginate', () => {
  it('gives the items of the asked page and the totals', () => {
    const result = paginate(items, 2, 10)
    expect(result.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(result).toMatchObject({ page: 2, pageSize: 10, totalItems: 23, totalPages: 3 })
  })

  it('shows the last page for a page past the end', () => {
    const result = paginate(items, 9, 10)
    expect(result.page).toBe(3)
    expect(result.items).toEqual([21, 22, 23])
  })

  it('has one empty page for an empty list', () => {
    expect(paginate([], 1, 10)).toMatchObject({ items: [], page: 1, totalPages: 1, totalItems: 0 })
  })
})
