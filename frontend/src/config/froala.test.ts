import { describe, expect, it, vi } from 'vitest'
import { createFroalaConfig, fixVietnameseTranslation } from './froala'

describe('createFroalaConfig', () => {
  it('tracks a video from upload start through editor insertion', () => {
    const onMediaInserted = vi.fn()
    const onMediaUploaded = vi.fn()
    const onUploadStarted = vi.fn()
    const config = createFroalaConfig({
      getAccessToken: () => 'access-token',
      onMediaInserted,
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

  it('sets the Bearer header on the editor right before an upload starts', () => {
    const onUploadStarted = vi.fn()
    const config = createFroalaConfig({
      getAccessToken: () => 'access-token',
      onMediaInserted: vi.fn(),
      onMediaUploaded: vi.fn(),
      onUploadStarted,
      onUploadError: vi.fn(),
    })
    const editor = { opts: { requestHeaders: { 'X-Test': '1' } } }

    config.events['image.beforeUpload'].call(editor)

    expect(editor.opts.requestHeaders).toEqual({
      'X-Test': '1',
      Authorization: 'Bearer access-token',
    })
    expect(onUploadStarted).toHaveBeenCalledOnce()
    expect(config).not.toHaveProperty('requestHeaders')
  })

  it('uses the dark editor theme only in dark mode', () => {
    const options = {
      getAccessToken: () => null,
      onMediaInserted: vi.fn(),
      onMediaUploaded: vi.fn(),
      onUploadStarted: vi.fn(),
      onUploadError: vi.fn(),
    }

    expect(createFroalaConfig({ ...options, theme: 'dark' })).toHaveProperty('theme', 'dark')
    expect(createFroalaConfig({ ...options, theme: 'light' })).not.toHaveProperty('theme')
    expect(createFroalaConfig(options)).not.toHaveProperty('theme')
  })
})

describe('fixVietnameseTranslation', () => {
  it('calls the character counter "Ký tự" and keeps the other words', () => {
    const froala = { LANGUAGE: { vi: { translation: { Characters: 'Nhân vật', Words: 'Từ' } } } }

    fixVietnameseTranslation(froala)

    expect(froala.LANGUAGE.vi.translation).toEqual({ Characters: 'Ký tự', Words: 'Từ' })
  })

  it('does nothing when the Vietnamese file is not loaded', () => {
    expect(() => fixVietnameseTranslation({})).not.toThrow()
    expect(() => fixVietnameseTranslation({ LANGUAGE: {} })).not.toThrow()
  })
})
