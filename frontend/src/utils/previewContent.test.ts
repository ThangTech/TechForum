import { describe, expect, it } from 'vitest'
import { hasPreviewContent } from './previewContent'

describe('hasPreviewContent', () => {
  it('is false for an empty editor', () => {
    expect(hasPreviewContent('')).toBe(false)
    expect(hasPreviewContent('<p><br></p>')).toBe(false)
    expect(hasPreviewContent('<p>&nbsp;</p>')).toBe(false)
    expect(hasPreviewContent('   ')).toBe(false)
  })

  it('is true when there is text', () => {
    expect(hasPreviewContent('<p>Xin chào</p>')).toBe(true)
    expect(hasPreviewContent('<pre>const a = 1;</pre>')).toBe(true)
  })

  it('is true when there is only a picture or a video', () => {
    expect(hasPreviewContent('<p><img src="/media/images/a.png"></p>')).toBe(true)
    expect(hasPreviewContent('<video src="/media/videos/a.mp4"></video>')).toBe(true)
  })
})
