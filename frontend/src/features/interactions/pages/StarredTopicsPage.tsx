import Typography from '@mui/material/Typography'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { PersonalTopicList } from '../../topics/components/PersonalTopicList'
import { useStarredTopicsPage } from '../hooks/useStarredTopicsPage'

// The posts that the member gave a star ("Sao hữu ích"), newest star first, to read them again.
export const StarredTopicsPage = () => {
  const { page, starredQuery, changePage } = useStarredTopicsPage()

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
