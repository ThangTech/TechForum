import { describe, expect, it } from 'vitest'
import { matchesCatalogFilter } from '../../../../features/admin/utils/catalogFilter'

const category = { name: 'Lập trình', slug: 'lap-trinh', isActive: true }
const stopped = { name: 'Cũ', slug: 'cu', isActive: false }

describe('matchesCatalogFilter', () => {
  it('finds by name or address, without the case', () => {
    expect(matchesCatalogFilter(category, 'LẬP', '')).toBe(true)
    expect(matchesCatalogFilter(category, 'LAP-TR', '')).toBe(true)
    expect(matchesCatalogFilter(category, 'react', '')).toBe(false)
  })

  it('filters by status', () => {
    expect(matchesCatalogFilter(category, '', 'active')).toBe(true)
    expect(matchesCatalogFilter(stopped, '', 'active')).toBe(false)
    expect(matchesCatalogFilter(stopped, '', 'inactive')).toBe(true)
    expect(matchesCatalogFilter(stopped, '', '')).toBe(true)
  })
})
