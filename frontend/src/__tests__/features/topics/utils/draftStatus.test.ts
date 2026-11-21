import { describe, expect, it } from 'vitest'
import { getDraftStatusText } from '../../../../features/topics/utils/draftStatus'

describe('getDraftStatusText', () => {
  it('tells the member what the automatic draft is doing', () => {
    expect(getDraftStatusText({ kind: 'idle' })).toBe('')
    expect(getDraftStatusText({ kind: 'saving' })).toBe('Đang tự lưu…')
    expect(getDraftStatusText({ kind: 'error' })).toContain('thử lại')
  })

  it('gives the time of the last automatic save', () => {
    expect(getDraftStatusText({ kind: 'saved', at: '2026-11-22T03:05:00Z' })).toMatch(/^Đã tự lưu lúc \d{2}:\d{2}$/)
  })
})
