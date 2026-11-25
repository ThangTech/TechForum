import { NotFoundPanel } from '../shared/components/NotFoundPanel'
import { PageShell } from '../shared/components/PageShell'
import { usePageMeta } from '../shared/hooks/usePageMeta'

// Địa chỉ không khớp trang nào: báo rõ thay vì lặng lẽ đưa về trang chủ.
export const NotFoundPage = () => {
  usePageMeta('Không tìm thấy trang', 'Trang bạn tìm không tồn tại trên TechForum.')
  return (
    <PageShell maxWidth={720}>
      <NotFoundPanel description="Đường dẫn có thể đã sai hoặc trang đã được chuyển đi. Bạn có thể về trang chủ hoặc tìm nội dung cần đọc." />
    </PageShell>
  )
}
