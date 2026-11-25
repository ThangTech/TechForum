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

export type BlockFormat = 'paragraph' | 'h2' | 'h3' | 'h4' | 'codeBlock'

interface RichTextEditorOptions {
  initialMedia: UploadedMedia[]
  value: string
  onChange: (value: string) => void
  onMediaChange: (media: UploadedMedia[]) => void
  onUploadStateChange: (isUploading: boolean) => void
}

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

// Trình soạn thảo bài viết (TipTap): nội dung HTML, tải ảnh/video, link, chế độ sửa HTML và bộ đếm.
export const useRichTextEditor = ({ initialMedia, value, onChange, onMediaChange, onUploadStateChange }: RichTextEditorOptions) => {
  const [uploadedMedia] = useState(() => new Map(initialMedia.map((media) => [media.link, media])))
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingUploadCount, setPendingUploadCount] = useState(0)
  const [htmlDraft, setHtmlDraft] = useState<string | null>(null)

  useEffect(() => {
    onUploadStateChange(pendingUploadCount > 0)
  }, [onUploadStateChange, pendingUploadCount])

  // Báo nội dung mới lên form, kèm danh sách media còn nằm trong bài (media đã xoá khỏi bài thì bỏ).
  const reportChange = useCallback((html: string) => {
    const activeMedia: UploadedMedia[] = []
    uploadedMedia.forEach((media, link) => {
      if (html.includes(link)) activeMedia.push(media)
    })
    onMediaChange(activeMedia)
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
      Image,
      Video,
      CharacterCount.configure({ limit: MAX_CONTENT_CHARACTERS }),
      Placeholder.configure({ placeholder: 'Viết điều gì đó...' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor__content reading-content',
        role: 'textbox',
        'aria-label': 'Nội dung',
        'aria-multiline': 'true',
      },
      // Kéo thả hoặc dán ảnh/video vào bài thì tải lên luôn, như bấm nút chèn.
      handleDrop: (_view, event) => uploadDroppedFiles(event.dataTransfer?.files, uploadFileRef.current),
      handlePaste: (_view, event) => uploadDroppedFiles(event.clipboardData?.files, uploadFileRef.current),
    },
    onUpdate: ({ editor: current }) => reportChangeRef.current(current.isEmpty ? '' : current.getHTML()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      blockFormat: current ? getBlockFormat(current) : 'paragraph',
      isBold: current?.isActive('bold') ?? false,
      isItalic: current?.isActive('italic') ?? false,
      isUnderline: current?.isActive('underline') ?? false,
      isStrike: current?.isActive('strike') ?? false,
      isOrderedList: current?.isActive('orderedList') ?? false,
      isBulletList: current?.isActive('bulletList') ?? false,
      isQuote: current?.isActive('blockquote') ?? false,
      isLink: current?.isActive('link') ?? false,
      characters: current?.storage.characterCount.characters() ?? 0,
      words: current?.storage.characterCount.words() ?? 0,
    }),
  })

  const uploadFile = useCallback(async (kind: EditorMediaKind, file: File) => {
    const problem = checkMediaFile(kind, file)
    if (problem) {
      setUploadError(problem)
      return
    }
    setUploadError(null)
    setPendingUploadCount((current) => current + 1)
    try {
      const media = await uploadEditorMedia(kind, file)
      uploadedMedia.set(media.link, media)
      // Chèn sau vùng đang chọn: nếu đang chọn ảnh/video vừa chèn thì không bị thay mất.
      const node = kind === 'image' ? { type: 'image', attrs: { src: media.link, alt: '' } } : { type: 'video', attrs: { src: media.link } }
      editor.chain().focus().insertContentAt(editor.state.selection.to, node).run()
    } catch (requestError) {
      setUploadError(getActionError(requestError, uploadFallback[kind]))
    } finally {
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
      setBlockFormat,
      editLink,
      uploadFile: (kind: EditorMediaKind, file: File) => void uploadFile(kind, file),
    },
    html: { isOpen: htmlDraft !== null, draft: htmlDraft ?? '', setDraft: setHtmlDraft, toggle: toggleHtmlMode },
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
