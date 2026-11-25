import { useEffect } from 'react'

const siteName = 'TechForum'

// Tiêu đề tab và mô tả của trang (Google hiện hai dòng này trong kết quả tìm kiếm).
// Rời trang thì trả lại tiêu đề và mô tả chung trong index.html.
export const usePageMeta = (title: string | undefined, description: string | undefined) => {
  useEffect(() => {
    if (!title) return
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const defaultTitle = document.title
    const defaultDescription = descriptionTag?.content ?? ''
    document.title = `${title} · ${siteName}`
    if (descriptionTag && description) descriptionTag.content = description
    return () => {
      document.title = defaultTitle
      if (descriptionTag) descriptionTag.content = defaultDescription
    }
  }, [description, title])
}
