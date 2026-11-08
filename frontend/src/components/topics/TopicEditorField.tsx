import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FroalaEditorModule from 'react-froala-wysiwyg'
import { useCallback, useEffect, useMemo, useState } from 'react'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import 'froala-editor/js/languages/vi.js'
import { parseUploadedMedia, type UploadedMedia } from '../../api/media'
import { useAuthStore } from '../../auth/authStore'
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingUploadCount, setPendingUploadCount] = useState(0)

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

  const config = useMemo(() => createFroalaConfig({
    getAccessToken: () => useAuthStore.getState().accessToken,
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
  }), [handleUploadError, startUpload, syncInsertedMedia, uploadedMedia])

  return (
    <Stack spacing={1}>
      <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 700 }}>Nội dung</Typography>
      <FroalaEditorComponent config={config} model={value} onModelChange={handleChange} tag="textarea" />
      {pendingUploadCount > 0 && (
        <Typography color="primary" role="status" variant="body2">Đang tải media lên, vui lòng chờ hoàn tất…</Typography>
      )}
      {uploadError && <Typography color="warning" role="status" variant="body2">{uploadError}</Typography>}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Stack>
  )
}

const getEditorHtml = (mediaElement: unknown): string | null => {
  if (typeof mediaElement !== 'object' || mediaElement === null) return null
  const element = (mediaElement as { 0?: Element })[0]
  return element?.closest<HTMLElement>('.fr-element')?.innerHTML ?? null
}
