const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const toAnswerHtml = (value: string) => value
  .trim()
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
  .join('')

export const toAnswerText = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document.querySelectorAll('br').forEach((element) => element.replaceWith('\n'))
  return Array.from(document.body.children)
    .map((element) => element.textContent?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n') || document.body.textContent?.trim() || ''
}
