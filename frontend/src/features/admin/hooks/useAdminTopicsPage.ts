import { useState, type FormEvent } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { isGuid } from '../../../shared/utils/ids'
import { readChoice } from '../../../shared/utils/searchParams'
import { useCategories } from '../../catalog/hooks/categories'
import type { AdminTopic, ModerationAction } from '../types/adminTopics'
import { useAdminTopics, useModerateTopic } from './topicQueries'

const PAGE_SIZE = 10

// Everything the admin page of moderation does: the filtered list of posts, the preview of one post, and a
// moderation action (hide, lock, pin, move...) with its reason.
export const useAdminTopicsPage = () => {
  const list = useListParams()
  const keyword = list.read('keyword')
  const type = readChoice(list.params.get('type'), ['article', 'question'] as const)
  const visibility = readChoice(list.params.get('visibility'), ['visible', 'draft', 'hidden', 'deleted'] as const)
  const categoryValue = list.params.get('categoryId')
  const categoryId = isGuid(categoryValue) ? categoryValue.toLowerCase() : undefined
  const feedback = useActionFeedback()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ topic: AdminTopic; action: ModerationAction } | null>(null)

  const topicsQuery = useAdminTopics({ keyword, type, visibility, categoryId, page: list.page, pageSize: PAGE_SIZE })
  const categoriesQuery = useCategories()
  const moderateMutation = useModerateTopic()
  const categories = categoriesQuery.data ?? []

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    list.change({
      keyword: String(fields.get('keyword') ?? '').trim(),
      type: String(fields.get('type') ?? ''),
      visibility: String(fields.get('visibility') ?? ''),
      categoryId: String(fields.get('categoryId') ?? ''),
    })
  }

  const retry = () => {
    if (topicsQuery.error) void topicsQuery.refetch()
    if (categoriesQuery.error) void categoriesQuery.refetch()
  }

  const choose = (topic: AdminTopic, action: ModerationAction) => {
    feedback.setError(null)
    setSelected({ topic, action })
  }

  const close = () => {
    feedback.setError(null)
    setSelected(null)
  }

  const confirm = async (reason: string, newCategoryId?: string) => {
    if (!selected || moderateMutation.isPending) return
    // The list loads again after the change.
    const done = await feedback.run(
      () => moderateMutation.mutateAsync({ topicId: selected.topic.id, action: selected.action, reason, categoryId: newCategoryId }),
      { success: 'Đã cập nhật trạng thái nội dung và ghi nhật ký quản trị.', failure: 'Không thể kiểm duyệt nội dung.' },
    )
    if (done) setSelected(null)
  }

  return {
    filters: { keyword, type, visibility, categoryId },
    categories,
    submitFilters,
    clearFilters: list.clear,
    changePage: list.changePage,
    data: topicsQuery.data ?? null,
    isLoading: isInitialLoading(topicsQuery) || isInitialLoading(categoriesQuery),
    error: getErrorMessage(topicsQuery.error, 'Không thể tải nội dung kiểm duyệt.') ??
      getErrorMessage(categoriesQuery.error, 'Không thể tải nội dung kiểm duyệt.'),
    retry,
    // While the dialog is open, its error is shown inside it instead of above the list.
    feedback: { error: selected ? null : feedback.error, success: feedback.success },
    preview: { topicId: previewId, open: setPreviewId, close: () => setPreviewId(null) },
    moderation: { selected, isBusy: moderateMutation.isPending, error: feedback.error, choose, close, confirm },
  }
}
