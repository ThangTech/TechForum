export const hasFroalaKey = Boolean(import.meta.env.VITE_FROALA_KEY?.trim())

export const froalaConfig = {
  ...(hasFroalaKey ? { key: import.meta.env.VITE_FROALA_KEY.trim() } : {}),
  attribution: true,
  charCounterMax: 100000,
  heightMin: 280,
  imageUpload: false,
  videoUpload: false,
  toolbarButtons: [
    'paragraphFormat', 'bold', 'italic', 'underline', 'strikeThrough',
    'formatOL', 'formatUL', 'quote', 'insertLink', 'insertHR', 'html',
  ],
}
