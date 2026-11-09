import { ApiError, apiBaseUrl } from './client'

export interface UploadedMedia {
  id: string
  link: string
  // The address that is stored in the content: https://res.cloudinary.com/... for a file on Cloudinary, or
  // /media/... for a file that was stored on the server before.
  path: string
}

// A file on Cloudinary has a full address. A file of the old storage has a path that starts with /media/.
const isFullAddress = (path: string): boolean => path.startsWith('https://')

const isMediaAddress = (path: string): boolean => path.startsWith('/media/') || isFullAddress(path)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const parseUploadedMedia = (response: unknown): UploadedMedia => {
  let data: unknown = response
  if (typeof response === 'string') {
    try {
      data = JSON.parse(response)
    } catch {
      throw new ApiError(500, 'API upload trả về dữ liệu không hợp lệ.')
    }
  }

  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    typeof data.link !== 'string' ||
    typeof data.path !== 'string' ||
    !isMediaAddress(data.path)
  ) {
    throw new ApiError(500, 'API upload trả về dữ liệu không đúng định dạng.')
  }

  return { id: data.id, link: data.link, path: data.path }
}

// A file on Cloudinary is shown from its own address. An old file of the media storage is served by the API, so its
// path gets the API address in front.
export const toMediaUrl = (path: string): string => (isFullAddress(path) ? path : `${apiBaseUrl}${path}`)

export const toStoredMediaHtml = (html: string, mediaItems: UploadedMedia[]): string =>
  mediaItems.reduce(
    (result, media) => result.split(media.link).join(media.path),
    html,
  )

const hasVideoAttribute = (attributes: string, name: string): boolean =>
  new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, 'i').test(attributes)

const addVideoPlaybackAttributes = (html: string): string =>
  html.replace(/<video\b([^>]*)>/gi, (_videoTag, rawAttributes: string) => {
    const attributes = rawAttributes.trim()
    const playbackAttributes = [
      !hasVideoAttribute(attributes, 'controls') ? 'controls' : '',
      !hasVideoAttribute(attributes, 'preload') ? 'preload="metadata"' : '',
      !hasVideoAttribute(attributes, 'playsinline') ? 'playsinline' : '',
    ].filter(Boolean)
    const normalizedAttributes = [attributes, ...playbackAttributes].filter(Boolean).join(' ')
    return `<video${normalizedAttributes ? ` ${normalizedAttributes}` : ''}>`
  })

export const toDisplayMediaHtml = (html: string): string => {
  const absoluteMediaHtml = html.replace(
    /(\bsrc=["'])\/media\//gi,
    `$1${apiBaseUrl}/media/`,
  )
  return addVideoPlaybackAttributes(absoluteMediaHtml)
}

export const toEditableMedia = (
  media: { id: string; path: string }[],
): UploadedMedia[] => media.map((item) => ({
  id: item.id,
  link: toMediaUrl(item.path),
  path: item.path,
}))
