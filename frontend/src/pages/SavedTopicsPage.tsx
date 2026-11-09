import { useSearchParams } from 'react-router-dom'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { PersonalTopicList } from '../components/topics/PersonalTopicList'
import { useSavedTopics } from '../queries/bookmarks'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const SavedTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const savedQuery = useSavedTopics(page, 10)

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <PageShell maxWidth={1240}>
      <PageHeading description="Các bài viết và câu hỏi bạn muốn đọc lại." eyebrow="Thư viện cá nhân" title="Nội dung đã lưu" />
      <PersonalTopicList
        dateLabel="Lưu"
        emptyTitle="Bạn chưa lưu nội dung nào"
        errorText="Không thể tải danh sách đã lưu."
        loadingText="Đang tải nội dung đã lưu…"
        onPageChange={changePage}
        page={page}
        pagerLabel="Phân trang nội dung đã lưu"
        query={savedQuery}
      />
    </PageShell>
  )
}
