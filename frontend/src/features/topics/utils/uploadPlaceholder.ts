import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'
import type { EditorMediaKind } from './editorMedia'

type PlaceholderAction =
  | { add: { id: string; pos: number; previewUrl: string; kind: EditorMediaKind } }
  | { remove: { id: string } }

const placeholderKey = new PluginKey<DecorationSet>('uploadPlaceholder')

// Ô xem trước ngay chỗ sẽ chèn: ảnh/video lấy thẳng từ tệp trên máy, mờ đi, kèm vòng xoay và chữ "Đang tải".
const createPreview = (kind: EditorMediaKind, previewUrl: string) => () => {
  const box = document.createElement('div')
  box.className = 'rich-editor__uploading'
  box.setAttribute('role', 'status')
  const media = document.createElement(kind === 'image' ? 'img' : 'video')
  media.src = previewUrl
  media.setAttribute('alt', '')
  if (media instanceof HTMLVideoElement) {
    media.muted = true
    media.preload = 'metadata'
  }
  const label = document.createElement('span')
  label.className = 'rich-editor__uploading-label'
  label.innerHTML = '<span class="rich-editor__spinner" aria-hidden="true"></span>'
  label.append(kind === 'image' ? 'Đang tải ảnh lên…' : 'Đang tải video lên…')
  box.append(media, label)
  return box
}

// Ô xem trước là "decoration" của ProseMirror: hiện trong trình soạn thảo nhưng không nằm trong nội dung,
// nên bản nháp tự lưu và HTML gửi lên API không bao giờ chứa địa chỉ blob: tạm.
export const UploadPlaceholder = Extension.create({
  name: 'uploadPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: placeholderKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, decorations) {
            let next = decorations.map(transaction.mapping, transaction.doc)
            const action = transaction.getMeta(placeholderKey) as PlaceholderAction | undefined
            if (action && 'add' in action) {
              const { id, pos, previewUrl, kind } = action.add
              const widget = Decoration.widget(pos, createPreview(kind, previewUrl), { id, key: id, side: 1 })
              next = next.add(transaction.doc, [widget])
            } else if (action && 'remove' in action) {
              next = next.remove(next.find(undefined, undefined, (spec) => spec.id === action.remove.id))
            }
            return next
          },
        },
        props: {
          decorations(state) {
            return placeholderKey.getState(state)
          },
        },
      }),
    ]
  },
})

export const addPlaceholderMeta = (action: PlaceholderAction) => [placeholderKey, action] as const

// Vị trí hiện tại của ô xem trước (đã dời theo những gì người dùng gõ thêm trong lúc chờ), null khi không còn.
export const findPlaceholder = (state: EditorState, id: string): number | null => {
  const found = placeholderKey.getState(state)?.find(undefined, undefined, (spec) => spec.id === id)
  return found && found.length > 0 ? found[0].from : null
}
