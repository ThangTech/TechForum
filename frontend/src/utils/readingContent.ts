export interface ReadingHeading {
  id: string
  title: string
  level: 2 | 3
}

export interface PreparedReadingContent {
  html: string
  headings: ReadingHeading[]
  readingMinutes: number
}

export const estimateReadingMinutes = (text: string, imageCount = 0): number => {
  const wordCount = text.trim() ? text.trim().split(/\s+/u).length : 0
  if (wordCount === 0 && imageCount === 0) return 0

  return Math.max(1, Math.ceil(wordCount / 220 + imageCount * 12 / 60))
}

// HTML được backend làm sạch trước khi lưu; DOMParser chỉ bổ sung điểm đến cho mục lục.
export const prepareReadingContent = (html: string, topicId: number): PreparedReadingContent => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const headings: ReadingHeading[] = []
  const usedIds = new Set(Array.from(document.querySelectorAll('[id]'), (element) => element.id))

  for (const element of document.querySelectorAll('h2, h3')) {
    const title = element.textContent?.replace(/\s+/gu, ' ').trim()
    if (!title) continue

    const baseId = `topic-${topicId}-heading-${headings.length + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }

    usedIds.add(id)
    element.id = id
    element.setAttribute('tabindex', '-1')
    headings.push({ id, title, level: element.tagName === 'H2' ? 2 : 3 })
  }

  const textParts: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) textParts.push(walker.currentNode.textContent ?? '')

  return {
    html: document.body.innerHTML,
    headings,
    readingMinutes: estimateReadingMinutes(textParts.join(' '), document.images.length),
  }
}
