import { apiRequest } from '../../../shared/api/client'
import { parseUploadedMedia } from '../../../shared/api/media'
import type { UploadedMedia } from '../../../shared/types/media'
import type { EditorMediaKind } from '../utils/editorMedia'

// Tải ảnh hoặc video của bài viết lên (API chuyển sang Cloudinary). apiRequest tự gắn token và làm mới token khi hết hạn.
export const uploadEditorMedia = async (kind: EditorMediaKind, file: File): Promise<UploadedMedia> => {
  const body = new FormData()
  body.append('file', file)
  const response = await apiRequest<unknown>(kind === 'image' ? '/api/media/images' : '/api/media/videos', {
    method: 'POST',
    body,
  })
  return parseUploadedMedia(response)
}
