import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { EditorContent } from '@tiptap/react'
import type { UploadedMedia } from '../../../shared/types/media'
import { useRichTextEditor } from '../hooks/useRichTextEditor'
import { MAX_CONTENT_CHARACTERS } from '../utils/editorMedia'
import '../styles/richEditor.css'
import { TopicEditorToolbar } from './TopicEditorToolbar'

interface TopicEditorFieldProps {
  error?: string
  initialMedia?: UploadedMedia[]
  value: string
  onChange: (value: string) => void
  onMediaChange: (media: UploadedMedia[]) => void
  onUploadStateChange: (isUploading: boolean) => void
}

export const TopicEditorField = ({ error, initialMedia = [], ...options }: TopicEditorFieldProps) => {
  const editor = useRichTextEditor({ initialMedia, ...options })

  return (
    <Stack spacing={1}>
      <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 700 }}>Nội dung</Typography>
      <div className="rich-editor">
        <TopicEditorToolbar editor={editor} />
        {/* Ở chế độ HTML, trình soạn thảo chỉ bị ẩn để giữ lịch sử hoàn tác. */}
        <div hidden={editor.html.isOpen}>
          <EditorContent editor={editor.editor} />
        </div>
        {editor.html.isOpen && (
          <textarea
            aria-label="Mã HTML của nội dung"
            className="rich-editor__html"
            onChange={(event) => editor.html.setDraft(event.target.value)}
            spellCheck={false}
            value={editor.html.draft}
          />
        )}
        <div className="rich-editor__footer">
          <span>Từ: {editor.state.words}</span>
          <span>Ký tự: {editor.state.characters}/{MAX_CONTENT_CHARACTERS}</span>
        </div>
      </div>
      {editor.isUploading && (
        <Typography color="primary" role="status" variant="body2">Đang tải media lên, vui lòng chờ hoàn tất…</Typography>
      )}
      {editor.uploadError && <Typography color="warning" role="status" variant="body2">{editor.uploadError}</Typography>}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Stack>
  )
}
