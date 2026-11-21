import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { PersonalTopicList } from '../../topics/components/PersonalTopicList'
import { useSavedTopicsPage } from '../hooks/useSavedTopicsPage'

export const SavedTopicsPage = () => {
  const { page, savedQuery, changePage } = useSavedTopicsPage()

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
