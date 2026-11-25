import { describe, expect, it } from 'vitest'
import { normalizeForSearch } from '../../../shared/utils/searchText'

describe('normalizeForSearch', () => {
  it('drops case and Vietnamese marks so a word can be found without typing them', () => {
    expect(normalizeForSearch('  Địt   Mẹ ')).toBe('dit me')
    expect(normalizeForSearch('Lập trình')).toBe('lap trinh')
  })
})
