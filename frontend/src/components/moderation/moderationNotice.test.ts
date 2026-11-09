import { describe, expect, it } from 'vitest'
import type { ContentCheckResult } from '../../api/moderation'
import { getChangedFieldLabels, getNoticeText, joinLabels } from './moderationNotice'

const result = (changes: Partial<ContentCheckResult>): ContentCheckResult => ({
  hasProfanity: true,
  title: null,
  summary: null,
  bodyHtml: null,
  ...changes,
})

describe('getChangedFieldLabels', () => {
  it('lists only the texts that the filter changes, in order', () => {
    expect(getChangedFieldLabels(result({ bodyHtml: '<p>***</p>', title: '***' }))).toEqual(['tiêu đề', 'nội dung'])
    expect(getChangedFieldLabels(result({ summary: '***' }))).toEqual(['tóm tắt'])
  })

  it('is empty when nothing changes or there is no answer yet', () => {
    expect(getChangedFieldLabels(undefined)).toEqual([])
    expect(getChangedFieldLabels(result({ hasProfanity: false }))).toEqual([])
  })

  it('uses the words of the form (an answer only has its content)', () => {
    const labels = { title: 'tiêu đề', summary: 'tóm tắt', bodyHtml: 'câu trả lời' }

    expect(getChangedFieldLabels(result({ bodyHtml: '***' }), labels)).toEqual(['câu trả lời'])
  })
})

describe('joinLabels', () => {
  it('joins names the way a sentence does', () => {
    expect(joinLabels([])).toBe('')
    expect(joinLabels(['nội dung'])).toBe('nội dung')
    expect(joinLabels(['tiêu đề', 'nội dung'])).toBe('tiêu đề và nội dung')
    expect(joinLabels(['tiêu đề', 'tóm tắt', 'nội dung'])).toBe('tiêu đề, tóm tắt và nội dung')
  })
})

describe('getNoticeText', () => {
  it('names the texts and says the words will be replaced', () => {
    const text = getNoticeText(result({ title: '***', bodyHtml: '***' }))

    expect(text).toContain('tiêu đề và nội dung')
    expect(text).toContain('***')
  })

  it('is null when there is nothing to warn about', () => {
    expect(getNoticeText(undefined)).toBeNull()
    expect(getNoticeText(result({ hasProfanity: false }))).toBeNull()
  })
})
