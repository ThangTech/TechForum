import Typography from '@mui/material/Typography'
import { useSearchParams } from 'react-router-dom'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { PersonalTopicList } from '../components/topics/PersonalTopicList'
import { useStarredTopics } from '../queries/stars'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

// The posts that the member gave a star ("Sao hữu ích"), newest star first, to read them again.
export const StarredTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const starredQuery = useStarredTopics(page, 10)

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <PageShell maxWidth={1240}>
      <PageHeading description="Các bài viết và câu hỏi bạn đã thả sao ⭐. Bỏ sao ở trang bài viết để xóa khỏi danh sách." eyebrow="Thư viện cá nhân" title="Bài đã thả sao" />
      <PersonalTopicList
        dateLabel="Thả sao"
        emptyHint={<Typography color="text.secondary" variant="body2">Bấm nút sao ở cuối một bài viết để thêm nó vào đây.</Typography>}
        emptyTitle="Bạn chưa thả sao bài nào"
        errorText="Không thể tải danh sách bài đã thả sao."
        loadingText="Đang tải bài đã thả sao…"
        onPageChange={changePage}
        page={page}
        pagerLabel="Phân trang bài đã thả sao"
        query={starredQuery}
      />
    </PageShell>
  )
}
