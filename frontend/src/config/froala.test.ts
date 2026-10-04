import { describe, expect, it, vi } from 'vitest'
import { createFroalaConfig } from './froala'

describe('createFroalaConfig', () => {
  it('tracks a video from upload start through editor insertion', () => {
    const onMediaInserted = vi.fn()
    const onMediaUploaded = vi.fn()
    const onUploadStarted = vi.fn()
    const config = createFroalaConfig({
      antiforgeryToken: 'csrf-token',
      onMediaInserted,
      onMediaRemoved: vi.fn(),
      onMediaUploaded,
      onUploadStarted,
      onUploadError: vi.fn(),
    })
    const videoElement = { 0: { tagName: 'VIDEO' } }
    const response = JSON.stringify({
      id: 'media-id',
      link: 'http://localhost:5045/media/videos/video.mp4',
      path: '/media/videos/video.mp4',
    })

    config.events['video.beforeUpload']()
    const shouldContinue = config.events['video.uploaded'](response)
    config.events['video.inserted'](videoElement)

    expect(onUploadStarted).toHaveBeenCalledOnce()
    expect(shouldContinue).toBe(true)
    expect(onMediaUploaded).toHaveBeenCalledWith({
      id: 'media-id',
      link: 'http://localhost:5045/media/videos/video.mp4',
      path: '/media/videos/video.mp4',
    })
    expect(onMediaInserted).toHaveBeenCalledWith(videoElement)
  })
})
