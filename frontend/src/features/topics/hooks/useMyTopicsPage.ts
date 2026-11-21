import { useState } from 'react'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { readChoice } from '../../../shared/utils/searchParams'
import { useDeleteTopic, useMyTopics } from './topics'

const PAGE_SIZE = 10

// The page "my content": the own posts with a search and a type filter, and deleting one after a confirmation.
export const useMyTopicsPage = () => {
  const list = useListParams()
  const keyword = list.read('keyword')
  const type = readChoice(list.params.get('type'), ['article', 'question'] as const) || undefined
  const topicsQuery = useMyTopics({
    page: list.page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    type: type === 'article' ? 'Article' : type === 'question' ? 'Question' : undefined,
  })
  const deleteMutation = useDeleteTopic()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const applyFilters = (nextKeyword: string, nextType: string | undefined) =>
    list.change({ keyword: nextKeyword, type: nextType ?? '' })

  const confirmDelete = async () => {
    if (deletingId === null || deleteMutation.isPending) return
    setDeleteError(null)
    try {
      // The list loads again after the delete.
      await deleteMutation.mutateAsync(deletingId)
      setDeletingId(null)
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : 'Không thể xóa nội dung.')
    }
  }

  return {
    filters: { keyword, type },
    applyFilters,
    changePage: list.changePage,
    data: topicsQuery.data ?? null,
    isLoading: isInitialLoading(topicsQuery),
    error: deleteError ?? getErrorMessage(topicsQuery.error, 'Không thể tải nội dung của bạn.'),
    retry: () => {
      setDeleteError(null)
      void topicsQuery.refetch()
    },
    removal: {
      isOpen: deletingId !== null,
      isBusy: deleteMutation.isPending,
      ask: setDeletingId,
      cancel: () => setDeletingId(null),
      confirm: confirmDelete,
    },
  }
}
