import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import type { BannedWord } from '../api/adminBannedWords'
import { ApiError } from '../api/client'
import { AdminEmptyState } from '../components/admin/AdminEmptyState'
import { AdminFeedback } from '../components/admin/AdminFeedback'
import { AdminPageHeading } from '../components/admin/AdminPageHeading'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog'
import { useAddBannedWord, useAdminBannedWords, useRemoveBannedWord } from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))

// The words that the API replaces by "***" in posts and answers before they are saved.
export const AdminBannedWordsPage = () => {
  const wordsQuery = useAdminBannedWords()
  const addMutation = useAddBannedWord()
  const removeMutation = useRemoveBannedWord()
  const [newWord, setNewWord] = useState('')
  const [keyword, setKeyword] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [wordToRemove, setWordToRemove] = useState<BannedWord | null>(null)

  const words = wordsQuery.data ?? []
  const isLoading = isInitialLoading(wordsQuery)
  const error = getErrorMessage(wordsQuery.error, 'Không thể tải danh sách từ cấm.')
  const shown = words.filter((item) => item.word.includes(keyword.trim().toLocaleLowerCase('vi')))

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (addMutation.isPending) return
    setActionError(null)
    setSuccessMessage(null)
    const word = newWord.trim()
    if (!word) {
      setActionError('Vui lòng nhập từ cần cấm.')
      return
    }
    try {
      const saved = await addMutation.mutateAsync(word)
      setNewWord('')
      setSuccessMessage(`Đã thêm "${saved.word}". Các bài viết và câu trả lời mới sẽ bị thay từ này bằng ***.`)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể thêm từ cấm.')
    }
  }

  const remove = async () => {
    if (!wordToRemove || removeMutation.isPending) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await removeMutation.mutateAsync(wordToRemove.id)
      setSuccessMessage(`Đã xóa "${wordToRemove.word}" khỏi danh sách.`)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể xóa từ cấm.')
    } finally {
      setWordToRemove(null)
    }
  }

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          description="Từ trong danh sách này tự động bị thay bằng *** khi thành viên đăng bài hoặc trả lời. Chỉ áp dụng cho nội dung mới; nội dung cũ không bị đổi."
          eyebrow="Quản trị nội dung"
          title="Từ cấm"
        />

        <form className="admin-toolbar" onSubmit={(event) => void add(event)}>
          <TextField
            disabled={addMutation.isPending}
            helperText="Có thể nhập cụm từ. Không phân biệt chữ hoa/thường nhưng phân biệt dấu: nếu muốn chặn cả dạng không dấu thì thêm riêng."
            label="Từ hoặc cụm từ cần cấm"
            onChange={(event) => setNewWord(event.target.value)}
            size="small"
            slotProps={{ htmlInput: { maxLength: 60 } }}
            sx={{ flex: 1, minWidth: 220, maxWidth: 560 }}
            value={newWord}
          />
          <Button loading={addMutation.isPending} sx={{ alignSelf: 'flex-start' }} type="submit" variant="contained">Thêm từ cấm</Button>
        </form>

        <AdminFeedback error={wordToRemove ? null : actionError} success={successMessage} />

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải danh sách từ cấm…"
            onRetry={() => void wordsQuery.refetch()}
          />
          {!isLoading && !error && (
            <>
              <div className="admin-toolbar">
                <TextField
                  label="Tìm trong danh sách"
                  onChange={(event) => setKeyword(event.target.value)}
                  size="small"
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                  sx={{ minWidth: 220 }}
                  value={keyword}
                />
                <span className="admin-table-secondary">{words.length} từ đang bị chặn</span>
              </div>
              {shown.length === 0 ? (
                <AdminEmptyState>
                  {words.length === 0 ? 'Chưa có từ cấm nào. Hãy thêm từ đầu tiên ở trên.' : 'Không có từ nào phù hợp với tìm kiếm.'}
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
                      {shown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><strong className="admin-table-primary">{item.word}</strong></TableCell>
                          <TableCell>{formatDate(item.createdAtUtc)}</TableCell>
                          <TableCell>
                            <div className="admin-table-actions">
                              <button disabled={removeMutation.isPending} onClick={() => { setActionError(null); setWordToRemove(item) }} type="button">Xóa</button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Xóa từ cấm"
        description={`Từ "${wordToRemove?.word ?? ''}" sẽ không còn bị thay bằng *** trong các bài viết và câu trả lời mới. Nội dung đã đăng không đổi.`}
        isBusy={removeMutation.isPending}
        isOpen={wordToRemove !== null}
        onCancel={() => setWordToRemove(null)}
        onConfirm={() => void remove()}
        title="Xóa từ cấm?"
      />
    </section>
  )
}
