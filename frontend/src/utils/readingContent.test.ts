import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes } from './readingContent'

describe('estimated reading duration', () => {
  it('does not assign reading time to empty content', () => {
    expect(estimateReadingMinutes(' \n\t ')).toBe(0)
  })

  it('shows at least a minute for a short Vietnamese explanation', () => {
    expect(estimateReadingMinutes('Giới thiệu cách đặt câu hỏi rõ ràng.')).toBe(1)
  })

  it('rounds long content up without treating line breaks as extra words', () => {
    const text = Array.from({ length: 441 }, () => 'nội-dung').join('\n\t')
    expect(estimateReadingMinutes(text)).toBe(3)
  })

  it('allows time to inspect images in technical tutorials', () => {
    const text = Array.from({ length: 220 }, () => 'từ').join(' ')
    expect(estimateReadingMinutes(text, 2)).toBe(2)
    expect(estimateReadingMinutes('', 1)).toBe(1)
  })
})
