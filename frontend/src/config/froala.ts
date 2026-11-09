import { apiBaseUrl } from '../api/client'
import { parseUploadedMedia, type UploadedMedia } from '../api/media'

// The part of the Froala class that holds its translations.
interface FroalaTranslations {
  LANGUAGE?: Record<string, { translation?: Record<string, string> } | undefined>
}

// Froala's Vietnamese file calls the counter "Characters" at the bottom of the editor "Nhân vật", which
// means characters of a story. The counter counts letters, so it is called "Ký tự".
export const fixVietnameseTranslation = (froala: FroalaTranslations): void => {
  const vietnamese = froala.LANGUAGE?.vi
  if (vietnamese?.translation) vietnamese.translation.Characters = 'Ký tự'
}

export const hasFroalaKey = Boolean(import.meta.env.VITE_FROALA_KEY?.trim())

// The part of the Froala editor object that the upload handlers use.
interface FroalaEditorInstance {
  opts?: { requestHeaders?: Record<string, string> }
  [property: string]: unknown
}

interface FroalaConfigOptions {
  getAccessToken: () => string | null
  onMediaInserted: (mediaElement: unknown) => void
  onMediaUploaded: (media: UploadedMedia) => void
  onUploadStarted: () => void
  onUploadError: (message: string) => void
  // "dark" gives the editor its dark colours (needs froala-editor/css/themes/dark.min.css).
  theme?: 'light' | 'dark'
}

export const createFroalaConfig = ({
  getAccessToken,
  onMediaInserted,
  onMediaUploaded,
  onUploadStarted,
  onUploadError,
  theme = 'light',
}: FroalaConfigOptions) => {
  // Froala reads its request headers when an upload starts, so the Bearer token is set right
  // before each upload. The session refreshes the token before it expires.
  const beforeUpload = function (this: FroalaEditorInstance) {
    const accessToken = getAccessToken()
    if (this.opts && accessToken) {
      this.opts.requestHeaders = {
        ...this.opts.requestHeaders,
        Authorization: `Bearer ${accessToken}`,
      }
    }
    onUploadStarted()
  }

  return {
    ...(hasFroalaKey ? { key: import.meta.env.VITE_FROALA_KEY.trim() } : {}),
    ...(theme === 'dark' ? { theme: 'dark' } : {}),
    attribution: true,
    language: 'vi',
    charCounterMax: 100000,
    heightMin: 280,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    imageMaxSize: 5 * 1024 * 1024,
    imageUpload: true,
    imageUploadMethod: 'POST',
    imageUploadParam: 'file',
    imageUploadURL: `${apiBaseUrl}/api/media/images`,
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
      initialized: function (this: { el: HTMLElement }) {
        this.el.setAttribute('role', 'textbox')
        this.el.setAttribute('aria-label', 'Nội dung')
        this.el.setAttribute('aria-multiline', 'true')
      },
      'image.beforeUpload': beforeUpload,
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
      'video.beforeUpload': beforeUpload,
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
  }
}
