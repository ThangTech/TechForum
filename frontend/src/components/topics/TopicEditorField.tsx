import FroalaEditorModule from 'react-froala-wysiwyg'
import { useCallback, useEffect, useMemo, useState } from 'react'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { getAntiforgeryToken } from '../../api/client'
import { parseUploadedMedia, type UploadedMedia } from '../../api/media'
import { createFroalaConfig } from '../../config/froala'
import { resolveModuleDefault } from '../../utils/moduleInterop'

const FroalaEditorComponent = resolveModuleDefault<typeof FroalaEditorModule>(FroalaEditorModule)

interface TopicEditorFieldProps {
  error?: string
  initialMedia?: UploadedMedia[]
  value: string
  onChange: (value: string) => void
  onMediaChange: (media: UploadedMedia[]) => void
  onUploadStateChange: (isUploading: boolean) => void
}

export const TopicEditorField = ({
  error,
  initialMedia = [],
  value,
  onChange,
  onMediaChange,
  onUploadStateChange,
}: TopicEditorFieldProps) => {
  const [uploadedMedia] = useState(() => new Map(
    initialMedia.map((media) => [media.link, media]),
  ))
  const [antiforgeryToken, setAntiforgeryToken] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingUploadCount, setPendingUploadCount] = useState(0)

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

  useEffect(() => {
    onUploadStateChange(pendingUploadCount > 0)
  }, [onUploadStateChange, pendingUploadCount])

  const handleChange = useCallback((html: string) => {
    const activeMedia: UploadedMedia[] = []
    uploadedMedia.forEach((media, link) => {
      if (html.includes(link)) activeMedia.push(media)
    })
    onMediaChange(activeMedia)
    onChange(html)
  }, [onChange, onMediaChange, uploadedMedia])

  const startUpload = useCallback(() => {
    setPendingUploadCount((current) => current + 1)
    setUploadError(null)
  }, [])

  const finishUpload = useCallback(() => {
    setPendingUploadCount((current) => Math.max(0, current - 1))
  }, [])

  const syncInsertedMedia = useCallback((mediaElement: unknown) => {
    const editorHtml = getEditorHtml(mediaElement)
    if (editorHtml !== null) handleChange(editorHtml)
    finishUpload()
  }, [finishUpload, handleChange])

  const handleUploadError = useCallback((message: string) => {
    setUploadError(message)
    finishUpload()
  }, [finishUpload])

  const config = useMemo(() => antiforgeryToken
    ? createFroalaConfig({
        antiforgeryToken,
        onMediaInserted: syncInsertedMedia,
        onMediaUploaded: (rawMedia) => {
          try {
            const media = parseUploadedMedia(rawMedia)
            uploadedMedia.set(media.link, media)
            setUploadError(null)
          } catch (requestError) {
            setUploadError(requestError instanceof Error ? requestError.message : 'Upload media thất bại.')
          }
        },
        onUploadStarted: startUpload,
        onUploadError: handleUploadError,
      })
    : null, [antiforgeryToken, handleUploadError, startUpload, syncInsertedMedia, uploadedMedia])

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
      {pendingUploadCount > 0 && (
        <p className="text-sm text-blue-700" role="status">Đang tải media lên, vui lòng chờ hoàn tất…</p>
      )}
      {uploadError && <p className="text-sm text-amber-700" role="status">{uploadError}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

const getEditorHtml = (mediaElement: unknown): string | null => {
  if (typeof mediaElement !== 'object' || mediaElement === null) return null
  const element = (mediaElement as { 0?: Element })[0]
  return element?.closest<HTMLElement>('.fr-element')?.innerHTML ?? null
}
