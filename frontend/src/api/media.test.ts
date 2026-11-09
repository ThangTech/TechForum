import { describe, expect, it } from 'vitest'
import { apiBaseUrl } from './client'
import { parseUploadedMedia, toDisplayMediaHtml, toEditableMedia, toMediaUrl, toStoredMediaHtml } from './media'

const cloudImage = 'https://res.cloudinary.com/demo/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png'

describe('toDisplayMediaHtml', () => {
  it('uses the configured API origin for stored media paths', () => {
    const result = toDisplayMediaHtml('<video src="/media/videos/demo.mp4"></video>')

    expect(result).toContain(`src="${apiBaseUrl}/media/videos/demo.mp4"`)
  })

  it('adds playback attributes without duplicating existing attributes', () => {
    const result = toDisplayMediaHtml(
      '<video controls preload="auto" src="/media/videos/demo.mp4"></video>',
    )

    expect(result.match(/controls/gi)).toHaveLength(1)
    expect(result).toContain('preload="auto"')
    expect(result).toContain('playsinline')
  })
})

describe('media on Cloudinary', () => {
  it('toMediaUrl leaves a full address as it is and puts the API address before an old path', () => {
    expect(toMediaUrl(cloudImage)).toBe(cloudImage)
    expect(toMediaUrl('/media/banners/a.png')).toBe(`${apiBaseUrl}/media/banners/a.png`)
  })

  it('toDisplayMediaHtml does not change a Cloudinary address', () => {
    const html = `<p><img src="${cloudImage}"></p>`

    expect(toDisplayMediaHtml(html)).toBe(html)
  })

  it('toEditableMedia uses the address of Cloudinary for the link and the path', () => {
    const [media] = toEditableMedia([{ id: 'x', path: cloudImage }])

    expect(media).toEqual({ id: 'x', link: cloudImage, path: cloudImage })
  })

  it('toEditableMedia still builds the link of an old file from the API address', () => {
    const [media] = toEditableMedia([{ id: 'x', path: '/media/images/a.png' }])

    expect(media.link).toBe(`${apiBaseUrl}/media/images/a.png`)
  })

  it('toStoredMediaHtml keeps a Cloudinary address and turns the link of an old file back into its path', () => {
    const cloudMedia = { id: 'a', link: cloudImage, path: cloudImage }
    const oldMedia = { id: 'b', link: `${apiBaseUrl}/media/images/b.png`, path: '/media/images/b.png' }
    const html = `<img src="${cloudImage}"><img src="${oldMedia.link}">`

    expect(toStoredMediaHtml(html, [cloudMedia, oldMedia])).toBe(`<img src="${cloudImage}"><img src="/media/images/b.png">`)
  })

  it('parseUploadedMedia accepts the answer of the API for a Cloudinary file and an old file', () => {
    expect(parseUploadedMedia({ id: 'a', link: cloudImage, path: cloudImage }).path).toBe(cloudImage)
    expect(parseUploadedMedia({ id: 'b', link: `${apiBaseUrl}/media/images/b.png`, path: '/media/images/b.png' }).path)
      .toBe('/media/images/b.png')
  })

  it('parseUploadedMedia refuses a path that is neither', () => {
    expect(() => parseUploadedMedia({ id: 'a', link: 'http://x/a.png', path: 'http://x/a.png' })).toThrow()
    expect(() => parseUploadedMedia({ id: 'a', link: 'x', path: '../a.png' })).toThrow()
  })
})
