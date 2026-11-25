import { useRef, type ChangeEvent, type ReactNode } from 'react'
import type { BlockFormat, useRichTextEditor } from '../hooks/useRichTextEditor'
import { getMediaAccept, type EditorMediaKind } from '../utils/editorMedia'
import {
  BoldIcon, BulletListIcon, CodeIcon, ImageIcon, ItalicIcon, LinkIcon, OrderedListIcon, QuoteIcon, RuleIcon,
  StrikeIcon, UnderlineIcon, VideoIcon,
} from './EditorIcons'

type RichTextEditor = ReturnType<typeof useRichTextEditor>

interface ToolButtonProps {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

const ToolButton = ({ label, active, disabled, onClick, children }: ToolButtonProps) => (
  <button
    aria-label={label}
    aria-pressed={active === undefined ? undefined : active}
    className="rich-editor__tool"
    disabled={disabled}
    onClick={onClick}
    // Giữ vùng chọn trong bài khi bấm nút.
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    {children}
  </button>
)

const blockFormats: { value: BlockFormat; label: string }[] = [
  { value: 'paragraph', label: 'Đoạn văn' },
  { value: 'h2', label: 'Tiêu đề lớn' },
  { value: 'h3', label: 'Tiêu đề vừa' },
  { value: 'h4', label: 'Tiêu đề nhỏ' },
  { value: 'codeBlock', label: 'Khối code' },
]

export const TopicEditorToolbar = ({ editor }: { editor: RichTextEditor }) => {
  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const { commands, state, html } = editor
  // Đang sửa HTML thì chỉ còn nút quay lại trình soạn thảo.
  const locked = html.isOpen

  const pickFile = (kind: EditorMediaKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) commands.uploadFile(kind, file)
  }

  return (
    <div aria-label="Định dạng nội dung" className="rich-editor__toolbar" role="toolbar">
      <select
        aria-label="Kiểu đoạn"
        className="rich-editor__format"
        disabled={locked}
        onChange={(event) => commands.setBlockFormat(event.target.value as BlockFormat)}
        value={state.blockFormat}
      >
        {blockFormats.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
      </select>
      <ToolButton active={state.isBold} disabled={locked} label="In đậm" onClick={commands.toggleBold}><BoldIcon /></ToolButton>
      <ToolButton active={state.isItalic} disabled={locked} label="In nghiêng" onClick={commands.toggleItalic}><ItalicIcon /></ToolButton>
      <ToolButton active={state.isUnderline} disabled={locked} label="Gạch chân" onClick={commands.toggleUnderline}><UnderlineIcon /></ToolButton>
      <ToolButton active={state.isStrike} disabled={locked} label="Gạch ngang" onClick={commands.toggleStrike}><StrikeIcon /></ToolButton>
      <span aria-hidden="true" className="rich-editor__divider" />
      <ToolButton active={state.isOrderedList} disabled={locked} label="Danh sách đánh số" onClick={commands.toggleOrderedList}><OrderedListIcon /></ToolButton>
      <ToolButton active={state.isBulletList} disabled={locked} label="Danh sách chấm" onClick={commands.toggleBulletList}><BulletListIcon /></ToolButton>
      <ToolButton active={state.isQuote} disabled={locked} label="Trích dẫn" onClick={commands.toggleQuote}><QuoteIcon /></ToolButton>
      <span aria-hidden="true" className="rich-editor__divider" />
      <ToolButton active={state.isLink} disabled={locked} label="Chèn link" onClick={commands.editLink}><LinkIcon /></ToolButton>
      <ToolButton disabled={locked} label="Chèn ảnh" onClick={() => imageInput.current?.click()}><ImageIcon /></ToolButton>
      <ToolButton disabled={locked} label="Chèn video" onClick={() => videoInput.current?.click()}><VideoIcon /></ToolButton>
      <ToolButton disabled={locked} label="Đường kẻ ngang" onClick={commands.insertRule}><RuleIcon /></ToolButton>
      <ToolButton active={html.isOpen} label="Sửa mã HTML" onClick={html.toggle}><CodeIcon /></ToolButton>
      <input accept={getMediaAccept('image')} hidden onChange={pickFile('image')} ref={imageInput} type="file" />
      <input accept={getMediaAccept('video')} hidden onChange={pickFile('video')} ref={videoInput} type="file" />
    </div>
  )
}
