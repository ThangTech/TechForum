export type EditorMediaKind = 'image' | 'video'

// Giống giới hạn của API (/api/media/images và /api/media/videos), kiểm tra trước để khỏi tải tệp sai lên.
const mediaRules = {
  image: {
    types: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
    problem: 'Ảnh phải là PNG, JPEG, GIF hoặc WebP, tối đa 5 MB.',
  },
  video: {
    types: ['video/mp4', 'video/webm'],
    maxBytes: 50 * 1024 * 1024,
    problem: 'Video phải là MP4 hoặc WebM, tối đa 50 MB.',
  },
}

export const MAX_CONTENT_CHARACTERS = 100000

export const getMediaAccept = (kind: EditorMediaKind): string => mediaRules[kind].types.join(',')

// Tệp kéo thả hoặc dán vào: là ảnh, video, hay không dùng được.
export const getMediaKind = (file: File): EditorMediaKind | null => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

// Câu báo lỗi khi tệp không đúng loại hoặc quá lớn, null khi tệp dùng được.
export const checkMediaFile = (kind: EditorMediaKind, file: File): string | null => {
  const rule = mediaRules[kind]
  if (!rule.types.includes(file.type) || file.size > rule.maxBytes) return rule.problem
  return null
}

// Chỉ nhận link http/https, thêm https:// khi người dùng gõ thiếu (ví dụ "github.com").
export const normalizeLinkUrl = (input: string): string | null => {
  const text = input.trim()
  if (text === '') return null
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withScheme)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
