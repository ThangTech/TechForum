import FroalaEditorComponent from 'react-froala-wysiwyg'
import { useEffect, useMemo, useState } from 'react'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { getAntiforgeryToken } from '../../api/client'
import { deleteUnusedMedia, parseUploadedMedia, type UploadedMedia } from '../../api/media'
import { createFroalaConfig } from '../../config/froala'

interface TopicEditorFieldProps {
  error?: string
  initialMedia?: UploadedMedia[]
  value: string
  onChange: (value: string) => void
  onMediaChange: (media: UploadedMedia[]) => void
}

export const TopicEditorField = ({
  error,
  initialMedia = [],
  value,
  onChange,
  onMediaChange,
}: TopicEditorFieldProps) => {
  const [uploadedMedia] = useState(() => new Map(
    initialMedia.map((media) => [media.link, media]),
  ))
  const [antiforgeryToken, setAntiforgeryToken] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    getAntiforgeryToken()
      .then((token) => {
        if (isActive) setAntiforgeryToken(token)
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setUploadError(requestError instanceof Error
            ? requestError.message
            : 'Không thể chuẩn bị chức năng tải media.')
        }
      })
    return () => { isActive = false }
  }, [])

  const config = useMemo(() => antiforgeryToken
    ? createFroalaConfig({
        antiforgeryToken,
        onMediaRemoved: (link) => {
          const media = uploadedMedia.get(link)
          if (!media) return
          uploadedMedia.delete(link)
          onMediaChange([...uploadedMedia.values()])
          void deleteUnusedMedia(media.id).catch(() => {
            setUploadError('Media đã bỏ khỏi bài sẽ được hệ thống tự dọn sau.')
          })
        },
        onMediaUploaded: (rawMedia) => {
          try {
            const media = parseUploadedMedia(rawMedia)
            uploadedMedia.set(media.link, media)
            setUploadError(null)
          } catch (requestError) {
            setUploadError(requestError instanceof Error ? requestError.message : 'Upload media thất bại.')
          }
        },
        onUploadError: setUploadError,
      })
    : null, [antiforgeryToken, onMediaChange, uploadedMedia])

  const handleChange = (html: string) => {
    const activeMedia: UploadedMedia[] = []
    uploadedMedia.forEach((media, link) => {
      if (html.includes(link)) {
        activeMedia.push(media)
        return
      }

    })
    onMediaChange(activeMedia)
    onChange(html)
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-slate-800">Nội dung</span>
      {!config && !uploadError && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Đang chuẩn bị trình soạn thảo…
        </p>
      )}
      {config && (
        <FroalaEditorComponent config={config} model={value} onModelChange={handleChange} tag="textarea" />
      )}
      {uploadError && <p className="text-sm text-amber-700" role="status">{uploadError}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
