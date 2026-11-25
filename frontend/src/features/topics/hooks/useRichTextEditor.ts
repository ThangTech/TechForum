import Image from '@tiptap/extension-image'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import type { UploadedMedia } from '../../../shared/types/media'
import { uploadEditorMedia } from '../api/editorMedia'
import { checkMediaFile, getMediaKind, MAX_CONTENT_CHARACTERS, normalizeLinkUrl, type EditorMediaKind } from '../utils/editorMedia'
import { Video } from '../utils/editorVideo'
import { addPlaceholderMeta, findPlaceholder, UploadPlaceholder } from '../utils/uploadPlaceholder'

export type BlockFormat = 'paragraph' | 'h2' | 'h3' | 'h4' | 'codeBlock'

interface RichTextEditorOptions {
  value: string
  onChange: (value: string) => void
  // Bài viết có ảnh/video; câu trả lời thì không (allowMedia = false).
  allowMedia?: boolean
  initialMedia?: UploadedMedia[]
  onMediaChange?: (media: UploadedMedia[]) => void
  onUploadStateChange?: (isUploading: boolean) => void
  characterLimit?: number
  placeholder?: string
  label?: string
}

const noMedia: UploadedMedia[] = []

const uploadFallback = {
  image: 'Không thể tải ảnh lên. Hãy kiểm tra định dạng và dung lượng tệp.',
  video: 'Không thể tải video lên. Hãy kiểm tra định dạng và dung lượng tệp.',
}

const getBlockFormat = (editor: Editor): BlockFormat => {
  if (editor.isActive('codeBlock')) return 'codeBlock'
  for (const level of [2, 3, 4] as const) {
    if (editor.isActive('heading', { level })) return `h${level}`
  }
  return 'paragraph'
}

const emptyState = {
  blockFormat: 'paragraph' as BlockFormat,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isOrderedList: false,
  isBulletList: false,
  isQuote: false,
  isLink: false,
  isCode: false,
  isCodeBlock: false,
  characters: 0,
  words: 0,
}

// Trạng thái cho thanh công cụ và bộ đếm. Hộp thoại MUI có thể dựng nội dung hai lần, nên editor đầu tiên bị huỷ
// (chưa có schema) mà vẫn được đọc: khi đó trả trạng thái rỗng thay vì làm sập trang.
const readEditorState = (current: Editor | null) => {
  if (!current || current.isDestroyed || !current.schema) return emptyState
  const counter = current.storage.characterCount
  return {
    blockFormat: getBlockFormat(current),
    isBold: current.isActive('bold'),
    isItalic: current.isActive('italic'),
    isUnderline: current.isActive('underline'),
    isStrike: current.isActive('strike'),
    isOrderedList: current.isActive('orderedList'),
    isBulletList: current.isActive('bulletList'),
    isQuote: current.isActive('blockquote'),
    isLink: current.isActive('link'),
    isCode: current.isActive('code'),
    isCodeBlock: current.isActive('codeBlock'),
    characters: counter ? counter.characters() : current.state.doc.textContent.length,
    words: counter ? counter.words() : 0,
  }
}

// Trình soạn thảo bài viết (TipTap): nội dung HTML, tải ảnh/video, link, chế độ sửa HTML và bộ đếm.
export const useRichTextEditor = ({
  value,
  onChange,
  allowMedia = true,
  initialMedia = noMedia,
  onMediaChange,
  onUploadStateChange,
  characterLimit = MAX_CONTENT_CHARACTERS,
  placeholder = 'Viết điều gì đó...',
  label = 'Nội dung',
}: RichTextEditorOptions) => {
  const [uploadedMedia] = useState(() => new Map(initialMedia.map((media) => [media.link, media])))
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingUploadCount, setPendingUploadCount] = useState(0)
  const [htmlDraft, setHtmlDraft] = useState<string | null>(null)

  useEffect(() => {
    onUploadStateChange?.(pendingUploadCount > 0)
  }, [onUploadStateChange, pendingUploadCount])

  // Báo nội dung mới lên form, kèm danh sách media còn nằm trong bài (media đã xoá khỏi bài thì bỏ).
  const reportChange = useCallback((html: string) => {
    const activeMedia: UploadedMedia[] = []
    uploadedMedia.forEach((media, link) => {
      if (html.includes(link)) activeMedia.push(media)
    })
    onMediaChange?.(activeMedia)
    onChange(html)
  }, [onChange, onMediaChange, uploadedMedia])
  // TipTap giữ hàm onUpdate của lần tạo đầu tiên, nên đọc hàm mới nhất qua ref.
  const reportChangeRef = useRef(reportChange)
  useEffect(() => {
    reportChangeRef.current = reportChange
  }, [reportChange])
  const uploadFileRef = useRef<(file: File) => void>(() => undefined)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      ...(allowMedia ? [Image, Video, UploadPlaceholder] : []),
      CharacterCount.configure({ limit: characterLimit }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor__content reading-content',
        role: 'textbox',
        'aria-label': label,
        'aria-multiline': 'true',
      },
      // Kéo thả hoặc dán ảnh/video vào bài thì tải lên luôn, như bấm nút chèn.
      handleDrop: (_view, event) => allowMedia && uploadDroppedFiles(event.dataTransfer?.files, uploadFileRef.current),
      handlePaste: (_view, event) => allowMedia && uploadDroppedFiles(event.clipboardData?.files, uploadFileRef.current),
    },
    onUpdate: ({ editor: current }) => reportChangeRef.current(current.isEmpty ? '' : current.getHTML()),
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor: current }) => readEditorState(current),
  })
  // Trước giao dịch đầu tiên, trạng thái có thể còn là của editor vừa bị huỷ: đọc lại từ editor hiện tại.
  const state = editorState.characters === 0 && editor && !editor.isDestroyed && editor.schema
    ? readEditorState(editor)
    : editorState

  const uploadFile = useCallback(async (kind: EditorMediaKind, file: File) => {
    const problem = checkMediaFile(kind, file)
    if (problem) {
      setUploadError(problem)
      return
    }
    setUploadError(null)
    setPendingUploadCount((current) => current + 1)
    // Hiện ngay ô xem trước kèm vòng xoay ở chỗ sẽ chèn (sau vùng đang chọn, để không thay mất ảnh vừa chèn).
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    editor.view.dispatch(editor.state.tr.setMeta(...addPlaceholderMeta({ add: { id, pos: editor.state.selection.to, previewUrl, kind } })))
    try {
      const media = await uploadEditorMedia(kind, file)
      uploadedMedia.set(media.link, media)
      const pos = findPlaceholder(editor.state, id) ?? editor.state.selection.to
      const node = kind === 'image' ? { type: 'image', attrs: { src: media.link, alt: '' } } : { type: 'video', attrs: { src: media.link } }
      editor.chain().insertContentAt(pos, node).run()
    } catch (requestError) {
      setUploadError(getActionError(requestError, uploadFallback[kind]))
    } finally {
      if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(...addPlaceholderMeta({ remove: { id } })))
      URL.revokeObjectURL(previewUrl)
      setPendingUploadCount((current) => Math.max(0, current - 1))
    }
  }, [editor, uploadedMedia])

  useEffect(() => {
    uploadFileRef.current = (file) => {
      const kind = getMediaKind(file)
      if (kind) void uploadFile(kind, file)
    }
  }, [uploadFile])

  const setBlockFormat = (format: BlockFormat) => {
    const chain = editor.chain().focus()
    if (format === 'paragraph') chain.setParagraph().run()
    else if (format === 'codeBlock') chain.setCodeBlock().run()
    else chain.setHeading({ level: Number(format.slice(1)) as 2 | 3 | 4 }).run()
  }

  // Link: hỏi địa chỉ, để trống thì bỏ link đang chọn.
  const editLink = () => {
    const current = editor.getAttributes('link').href as string | undefined
    const input = window.prompt('Địa chỉ link (để trống để bỏ link):', current ?? 'https://')
    if (input === null) return
    if (input.trim() === '' || input.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const href = normalizeLinkUrl(input)
    if (!href) {
      setUploadError('Link phải bắt đầu bằng http:// hoặc https://.')
      return
    }
    setUploadError(null)
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  // Chế độ HTML: sửa thẳng mã HTML, thoát ra thì nạp lại vào trình soạn thảo.
  const toggleHtmlMode = () => {
    if (htmlDraft === null) {
      setHtmlDraft(editor.isEmpty ? '' : editor.getHTML())
      return
    }
    editor.commands.setContent(htmlDraft, { emitUpdate: true })
    setHtmlDraft(null)
  }

  return {
    editor,
    state,
    commands: {
      toggleBold: () => editor.chain().focus().toggleBold().run(),
      toggleItalic: () => editor.chain().focus().toggleItalic().run(),
      toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
      toggleStrike: () => editor.chain().focus().toggleStrike().run(),
      toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
      toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
      toggleQuote: () => editor.chain().focus().toggleBlockquote().run(),
      insertRule: () => editor.chain().focus().setHorizontalRule().run(),
      toggleCode: () => editor.chain().focus().toggleCode().run(),
      toggleCodeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
      // Gửi xong thì làm trống ô để viết câu tiếp theo.
      clear: () => editor.commands.clearContent(true),
      setBlockFormat,
      editLink,
      uploadFile: (kind: EditorMediaKind, file: File) => void uploadFile(kind, file),
    },
    html: { isOpen: htmlDraft !== null, draft: htmlDraft ?? '', setDraft: setHtmlDraft, toggle: toggleHtmlMode },
    characterLimit,
    isUploading: pendingUploadCount > 0,
    uploadError,
  }
}

// Trả true khi đã nhận tệp (TipTap không xử lý tiếp), false để TipTap dán/thả như bình thường.
const uploadDroppedFiles = (files: FileList | undefined, upload: (file: File) => void): boolean => {
  const mediaFiles = Array.from(files ?? []).filter((file) => getMediaKind(file) !== null)
  if (mediaFiles.length === 0) return false
  mediaFiles.forEach(upload)
  return true
}
