import { apiBaseUrl } from '../api/client'
import { parseUploadedMedia, type UploadedMedia } from '../api/media'

export const hasFroalaKey = Boolean(import.meta.env.VITE_FROALA_KEY?.trim())

interface FroalaConfigOptions {
  antiforgeryToken: string
  onMediaInserted: (mediaElement: unknown) => void
  onMediaUploaded: (media: UploadedMedia) => void
  onUploadStarted: () => void
  onUploadError: (message: string) => void
}

export const createFroalaConfig = ({
  antiforgeryToken,
  onMediaInserted,
  onMediaUploaded,
  onUploadStarted,
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
    'image.beforeUpload': onUploadStarted,
    'image.uploaded': (response: unknown) => {
      try {
        onMediaUploaded(parseUploadedMedia(response))
        return true
      } catch {
        onUploadError('Không đọc được kết quả tải ảnh từ API.')
        return false
      }
    },
    'image.inserted': onMediaInserted,
    'video.beforeUpload': onUploadStarted,
    'video.uploaded': (response: unknown) => {
      try {
        onMediaUploaded(parseUploadedMedia(response))
        return true
      } catch {
        onUploadError('Không đọc được kết quả tải video từ API.')
        return false
      }
    },
    'video.inserted': onMediaInserted,
    'image.error': () => onUploadError('Không thể tải ảnh lên. Hãy kiểm tra định dạng và dung lượng tệp.'),
    'video.error': () => onUploadError('Không thể tải video lên. Hãy kiểm tra định dạng và dung lượng tệp.'),
  },
})
