import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../../../shared/feedback/ConfirmDialog'
import { AdminEmptyState } from '../components/AdminEmptyState'
import { AdminFeedback } from '../components/AdminFeedback'
import { AdminPageHeading } from '../components/AdminPageHeading'
import { AdminPagination } from '../components/AdminPagination'
import { useAdminBannedWordsPage } from '../hooks/useAdminBannedWordsPage'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))

// The words that the API replaces by "***" in posts and answers before they are saved.
export const AdminBannedWordsPage = () => {
  const view = useAdminBannedWordsPage()
  const { adding, removal } = view

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          description="Từ trong danh sách này tự động bị thay bằng *** khi thành viên đăng bài hoặc trả lời. Chỉ áp dụng cho nội dung mới; nội dung cũ không bị đổi."
          eyebrow="Quản trị nội dung"
          title="Từ cấm"
        />

        <form className="admin-toolbar" onSubmit={(event) => void adding.submit(event)}>
          <TextField
            disabled={adding.isBusy}
            helperText="Có thể nhập cụm từ. Không phân biệt chữ hoa/thường nhưng phân biệt dấu, để không che nhầm từ thường (ví dụ dạng không dấu của một từ tục có thể là một từ bình thường). Muốn chặn cả dạng không dấu thì thêm riêng."
            label="Từ hoặc cụm từ cần cấm"
            onChange={(event) => adding.setWord(event.target.value)}
            size="small"
            slotProps={{ htmlInput: { maxLength: 60 } }}
            sx={{ flex: 1, minWidth: 220, maxWidth: 560 }}
            value={adding.word}
          />
          <Button loading={adding.isBusy} sx={{ alignSelf: 'flex-start' }} type="submit" variant="contained">Thêm từ cấm</Button>
        </form>

        <AdminFeedback error={view.feedback.error} success={view.feedback.success} />

        <div>
          <AsyncStatePanel error={view.error} isLoading={view.isLoading} loadingText="Đang tải danh sách từ cấm…" onRetry={view.retry} />
          {!view.isLoading && !view.error && (
            <>
              <div className="admin-toolbar">
                <TextField
                  label="Tìm trong danh sách"
                  onChange={(event) => view.setKeyword(event.target.value)}
                  size="small"
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                  sx={{ minWidth: 220 }}
                  value={view.keyword}
                />
                <span className="admin-table-secondary">{view.words.length} từ đang bị chặn</span>
              </div>
              {view.shown.length === 0 ? (
                <AdminEmptyState>
                  {view.words.length === 0 ? 'Chưa có từ cấm nào. Hãy thêm từ đầu tiên ở trên.' : 'Không có từ nào phù hợp với tìm kiếm.'}
                </AdminEmptyState>
              ) : (
                <div className="admin-table-scroll">
                  <Table className="admin-table" size="small">
                    <caption className="sr-only">Danh sách từ cấm</caption>
                    <TableHead>
                      <TableRow>
                        <TableCell>Từ cấm</TableCell>
                        <TableCell>Ngày thêm</TableCell>
                        <TableCell>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {view.shown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><strong className="admin-table-primary">{item.word}</strong></TableCell>
                          <TableCell>{formatDate(item.createdAtUtc)}</TableCell>
                          <TableCell>
                            <div className="admin-table-actions">
                              <button disabled={removal.isBusy} onClick={() => removal.ask(item)} type="button">Xóa</button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {view.shown.length > 0 && <AdminPagination {...view.paging} />}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Xóa từ cấm"
        description={`Từ "${removal.word?.word ?? ''}" sẽ không còn bị thay bằng *** trong các bài viết và câu trả lời mới. Nội dung đã đăng không đổi.`}
        isBusy={removal.isBusy}
        isOpen={removal.word !== null}
        onCancel={removal.cancel}
        onConfirm={() => void removal.confirm()}
        title="Xóa từ cấm?"
      />
    </section>
  )
}
