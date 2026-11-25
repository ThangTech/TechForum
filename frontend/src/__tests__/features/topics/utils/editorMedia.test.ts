import { describe, expect, it } from 'vitest'
import { checkMediaFile, getMediaKind, normalizeLinkUrl } from '../../../../features/topics/utils/editorMedia'

const fileOf = (type: string, size: number) => {
  const file = new File(['x'], 'tep', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('checkMediaFile', () => {
  it('accepts a picture and a video inside the limits of the API', () => {
    expect(checkMediaFile('image', fileOf('image/webp', 5 * 1024 * 1024))).toBeNull()
    expect(checkMediaFile('video', fileOf('video/mp4', 50 * 1024 * 1024))).toBeNull()
  })

  it('refuses a wrong type or a file that is too large', () => {
    expect(checkMediaFile('image', fileOf('image/svg+xml', 100))).toContain('PNG, JPEG, GIF hoặc WebP')
    expect(checkMediaFile('image', fileOf('image/png', 5 * 1024 * 1024 + 1))).toContain('5 MB')
    expect(checkMediaFile('video', fileOf('video/quicktime', 100))).toContain('MP4 hoặc WebM')
  })
})

describe('getMediaKind', () => {
  it('tells a dropped picture from a video and ignores other files', () => {
    expect(getMediaKind(fileOf('image/png', 1))).toBe('image')
    expect(getMediaKind(fileOf('video/webm', 1))).toBe('video')
    expect(getMediaKind(fileOf('application/pdf', 1))).toBeNull()
  })
})

describe('normalizeLinkUrl', () => {
  it('adds https:// to an address typed without it', () => {
    expect(normalizeLinkUrl(' github.com/ThangTech ')).toBe('https://github.com/ThangTech')
  })

  it('keeps http and https links and refuses other schemes', () => {
    expect(normalizeLinkUrl('http://example.com')).toBe('http://example.com/')
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeLinkUrl('   ')).toBeNull()
  })
})
