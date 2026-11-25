import { mergeAttributes, Node } from '@tiptap/react'

// Video tải lên Cloudinary, lưu thành <video src="..." controls>. Đọc được cả bài cũ của Froala
// (<video><source src="..."></video> hoặc video nằm trong <span class="fr-video">).
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src') ?? element.querySelector('source')?.getAttribute('src') ?? null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'video' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: '', preload: 'metadata', playsinline: '' })]
  },
})
