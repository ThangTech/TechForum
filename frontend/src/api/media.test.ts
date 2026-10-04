import { describe, expect, it } from 'vitest'
import { apiBaseUrl } from './client'
import { toDisplayMediaHtml } from './media'

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
