import { EditorContent } from '@tiptap/react'
import type { ReactNode } from 'react'
import '../../topics/styles/richEditor.css'
import { BoldIcon, BulletListIcon, CodeIcon, InlineCodeIcon, ItalicIcon, LinkIcon, OrderedListIcon, QuoteIcon } from '../../topics/components/EditorIcons'
import type { useRichTextEditor } from '../../topics/hooks/useRichTextEditor'

type AnswerRichEditor = ReturnType<typeof useRichTextEditor>

const Tool = ({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    aria-label={label}
    aria-pressed={active}
    className="rich-editor__tool"
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    {children}
  </button>
)

// Ô soạn câu trả lời gọn: chữ đậm, nghiêng, code, khối code, link, danh sách, trích dẫn.
// Gõ kiểu markdown (```, **, -, >) cũng tự thành định dạng.
export const AnswerEditor = ({ editor }: { editor: AnswerRichEditor }) => {
  const { commands, state } = editor
  return (
    <div className="rich-editor rich-editor--compact">
      <div aria-label="Định dạng câu trả lời" className="rich-editor__toolbar" role="toolbar">
        <Tool active={state.isBold} label="In đậm" onClick={commands.toggleBold}><BoldIcon /></Tool>
        <Tool active={state.isItalic} label="In nghiêng" onClick={commands.toggleItalic}><ItalicIcon /></Tool>
        <Tool active={state.isCode} label="Code trong dòng" onClick={commands.toggleCode}><InlineCodeIcon /></Tool>
        <Tool active={state.isCodeBlock} label="Khối code" onClick={commands.toggleCodeBlock}><CodeIcon /></Tool>
        <span aria-hidden="true" className="rich-editor__divider" />
        <Tool active={state.isLink} label="Chèn link" onClick={commands.editLink}><LinkIcon /></Tool>
        <Tool active={state.isBulletList} label="Danh sách chấm" onClick={commands.toggleBulletList}><BulletListIcon /></Tool>
        <Tool active={state.isOrderedList} label="Danh sách đánh số" onClick={commands.toggleOrderedList}><OrderedListIcon /></Tool>
        <Tool active={state.isQuote} label="Trích dẫn" onClick={commands.toggleQuote}><QuoteIcon /></Tool>
      </div>
      <EditorContent editor={editor.editor} />
      <div className="rich-editor__footer">
        <span>Mẹo: gõ ``` để chèn khối code, `code` cho code trong dòng.</span>
        <span>{editor.state.characters.toLocaleString('vi-VN')}/{editor.characterLimit.toLocaleString('vi-VN')} ký tự</span>
      </div>
    </div>
  )
}
