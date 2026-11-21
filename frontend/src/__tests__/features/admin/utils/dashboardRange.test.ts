import { describe, expect, it } from 'vitest'
import { getDateRangeError } from '../../../../features/admin/hooks/useAdminAuditPage'
import { daysBefore, getQuickRange, getRangeError, readDate } from '../../../../features/admin/utils/dashboardRange'

describe('daysBefore', () => {
  it('counts back across months and years', () => {
    expect(daysBefore('2026-11-10', 29)).toBe('2026-10-12')
    expect(daysBefore('2026-01-03', 6)).toBe('2025-12-28')
  })
})

describe('readDate', () => {
  it('keeps a real day and replaces anything else', () => {
    expect(readDate('2026-11-10', 'x')).toBe('2026-11-10')
    expect(readDate('10/11/2026', 'x')).toBe('x')
    expect(readDate(null, 'x')).toBe('x')
  })
})

describe('getRangeError', () => {
  it('refuses a start after the end and a range longer than 366 days', () => {
    expect(getRangeError('2026-11-10', '2026-11-01')).toContain('trước hoặc bằng')
    expect(getRangeError('2025-01-01', '2026-11-10')).toContain('366')
    expect(getRangeError('2026-11-01', '2026-11-10')).toBeNull()
  })
})

describe('getQuickRange', () => {
  it('knows the quick ranges that end today', () => {
    expect(getQuickRange('2026-11-04', '2026-11-10', '2026-11-10')).toBe(7)
    expect(getQuickRange('2026-10-12', '2026-11-10', '2026-11-10')).toBe(30)
    expect(getQuickRange('2026-10-12', '2026-11-10', '2026-11-11')).toBeNull()
    expect(getQuickRange('2026-11-01', '2026-11-10', '2026-11-10')).toBeNull()
  })
})

describe('getDateRangeError of the admin log', () => {
  it('refuses a start after the end and accepts a missing date', () => {
    expect(getDateRangeError('2026-11-10', '2026-11-01')).not.toBeNull()
    expect(getDateRangeError('2026-11-10', null)).toBeNull()
    expect(getDateRangeError('2026-11-01', '2026-11-01')).toBeNull()
  })
})
