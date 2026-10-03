import { ApiError, apiBaseUrl, apiRequest } from './client'

export interface UploadedMedia {
  id: string
  link: string
  path: string
}

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
    !data.path.startsWith('/media/')
  ) {
    throw new ApiError(500, 'API upload trả về dữ liệu không đúng định dạng.')
  }

  return { id: data.id, link: data.link, path: data.path }
}

export const toStoredMediaHtml = (html: string, mediaItems: UploadedMedia[]): string =>
  mediaItems.reduce(
    (result, media) => result.split(media.link).join(media.path),
    html,
  )

export const toDisplayMediaHtml = (html: string): string =>
  html.replace(/(\bsrc=["'])\/media\//gi, `$1${apiBaseUrl}/media/`)

export const toEditableMedia = (
  media: { id: string; path: string }[],
): UploadedMedia[] => media.map((item) => ({
  id: item.id,
  link: `${apiBaseUrl}${item.path}`,
  path: item.path,
}))

export const deleteUnusedMedia = async (id: string): Promise<void> => {
  await apiRequest(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
