import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { TopicType } from '../api/topics'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog'
import { OwnTopicFilters } from '../components/topics/OwnTopicFilters'
import { OwnTopicList } from '../components/topics/OwnTopicList'
import { appRoutes } from '../appRoutes'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import { useDeleteTopic, useMyTopics } from '../queries/topics'

const readPositiveInteger = (value: string | null) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const readTopicType = (value: string | null): TopicType | undefined =>
  value === 'article' || value === 'question' ? value : undefined

export const MyTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPositiveInteger(searchParams.get('page'))
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const type = readTopicType(searchParams.get('type'))
  const topicsQuery = useMyTopics({
    page,
    pageSize: 10,
    keyword: keyword || undefined,
    type: type === 'article' ? 'Article' : type === 'question' ? 'Question' : undefined,
  })
  const deleteMutation = useDeleteTopic()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const data = topicsQuery.data ?? null
  const isLoading = isInitialLoading(topicsQuery)
  const isDeleting = deleteMutation.isPending
  const error = deleteError ?? getErrorMessage(topicsQuery.error, 'Không thể tải nội dung của bạn.')

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next)
  }

  const confirmDelete = async () => {
    if (deletingId === null || isDeleting) return
    setDeleteError(null)
    try {
      // The list loads again after the delete.
      await deleteMutation.mutateAsync(deletingId)
      setDeletingId(null)
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : 'Không thể xóa nội dung.')
    }
  }

  return (
    <PageShell>
      <PageHeading
        actions={<Button component={Link} to={appRoutes.write} variant="contained">Viết nội dung</Button>}
        description="Quản lý bản nháp và theo dõi trạng thái nội dung đã xuất bản."
        eyebrow="Không gian cá nhân"
        title="Nội dung của tôi"
      />

      <Box sx={{ mt: 3 }}>
        <OwnTopicFilters
          key={`${keyword}-${type ?? 'all'}`}
          initialKeyword={keyword}
          initialType={type}
          onApply={(nextKeyword, nextType) => updateParams({ keyword: nextKeyword || undefined, type: nextType, page: undefined })}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải nội dung của bạn…"
          onRetry={() => {
            setDeleteError(null)
            void topicsQuery.refetch()
          }}
        />
        {!isLoading && !error && data && (
          <OwnTopicList
            data={data}
            onDelete={setDeletingId}
            onPageChange={(nextPage) => updateParams({ page: nextPage <= 1 ? undefined : nextPage })}
          />
        )}
      </Box>
      <ConfirmDialog
        confirmLabel="Xóa nội dung"
        description="Nội dung chưa có câu trả lời sẽ được xóa mềm và không còn xuất hiện công khai. Nội dung đã có đóng góp cộng đồng không thể tự xóa; bạn cần liên hệ quản trị viên khi cần xử lý."
        isBusy={isDeleting}
        isOpen={deletingId !== null}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
        title="Xóa nội dung này?"
      />
    </PageShell>
  )
}
