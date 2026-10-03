import { apiBaseUrl } from '../api/client'
import { parseUploadedMedia, type UploadedMedia } from '../api/media'

export const hasFroalaKey = Boolean(import.meta.env.VITE_FROALA_KEY?.trim())

interface FroalaConfigOptions {
  antiforgeryToken: string
  onMediaRemoved: (link: string) => void
  onMediaUploaded: (media: UploadedMedia) => void
  onUploadError: (message: string) => void
}

export const createFroalaConfig = ({
  antiforgeryToken,
  onMediaRemoved,
  onMediaUploaded,
  onUploadError,
}: FroalaConfigOptions) => ({
  ...(hasFroalaKey ? { key: import.meta.env.VITE_FROALA_KEY.trim() } : {}),
  attribution: true,
  charCounterMax: 100000,
  heightMin: 280,
  imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  imageMaxSize: 5 * 1024 * 1024,
  imageUpload: true,
  imageUploadMethod: 'POST',
  imageUploadParam: 'file',
  imageUploadURL: `${apiBaseUrl}/api/media/images`,
  requestHeaders: { 'X-CSRF-TOKEN': antiforgeryToken },
  requestWithCredentials: true,
  toolbarButtons: [
    'paragraphFormat', 'bold', 'italic', 'underline', 'strikeThrough',
    'formatOL', 'formatUL', 'quote', 'insertLink', 'insertImage', 'insertVideo',
    'insertHR', 'html',
  ],
  videoAllowedTypes: ['mp4', 'webm'],
  videoMaxSize: 50 * 1024 * 1024,
  videoUpload: true,
  videoUploadMethod: 'POST',
  videoUploadParam: 'file',
  videoUploadURL: `${apiBaseUrl}/api/media/videos`,
  events: {
    'image.uploaded': (response: unknown) => {
      try {
        onMediaUploaded(parseUploadedMedia(response))
        return true
      } catch {
        onUploadError('Không đọc được kết quả tải ảnh từ API.')
        return false
      }
    },
    'image.removed': (image: unknown) => {
      const link = getMediaSource(image)
      if (link) onMediaRemoved(link)
    },
    'video.uploaded': (response: unknown) => {
      try {
        onMediaUploaded(parseUploadedMedia(response))
      } catch {
        onUploadError('Không đọc được kết quả tải video từ API.')
      }
    },
    'video.removed': (video: unknown) => {
      const link = getMediaSource(video)
      if (link) onMediaRemoved(link)
    },
    'image.error': () => onUploadError('Không thể tải ảnh lên. Hãy kiểm tra định dạng và dung lượng tệp.'),
    'video.error': () => onUploadError('Không thể tải video lên. Hãy kiểm tra định dạng và dung lượng tệp.'),
  },
})

interface FroalaMediaElement {
  attr?: (name: string) => unknown
  find?: (selector: string) => FroalaMediaElement
}

const getMediaSource = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) return null
  const element = value as FroalaMediaElement
  const directSource = element.attr?.('src')
  if (typeof directSource === 'string') return directSource
  const nestedSource = element.find?.('img,video,source').attr?.('src')
  return typeof nestedSource === 'string' ? nestedSource : null
}
