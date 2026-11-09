// Whether the preview has anything to show. The editor leaves empty tags such as <p><br></p> in an empty box,
// so only a picture, a video or real text counts.
export const hasPreviewContent = (html: string): boolean => {
  if (/<(img|video)\b/i.test(html)) return true
  return html.replace(/<[^>]*>|&nbsp;/gi, '').trim() !== ''
}
