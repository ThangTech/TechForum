import { useState } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { paginate } from '../../../shared/utils/paginate'
import { readChoice } from '../../../shared/utils/searchParams'
import type { AdminTag, SaveTagInput } from '../types/adminTags'
import { matchesCatalogFilter } from '../utils/catalogFilter'
import { useAdminTags, useSaveAdminTag, useToggleAdminTag } from './tagQueries'

const PAGE_SIZE = 15
export const TAG_FILTER_KEYS = ['keyword', 'status'] as const

// Everything the admin page of tags does: the filtered list, the form to create or edit, and turning a tag on or off.
export const useAdminTagsPage = () => {
  const list = useListParams()
  const keyword = list.read('keyword')
  const status = readChoice(list.params.get('status'), ['active', 'inactive'] as const)
  const feedback = useActionFeedback()
  const [editing, setEditing] = useState<AdminTag | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const tagsQuery = useAdminTags()
  const saveMutation = useSaveAdminTag(editing?.id ?? null)
  const toggleMutation = useToggleAdminTag()

  const filtered = (tagsQuery.data ?? []).filter((item) => matchesCatalogFilter(item, keyword, status))
  const pageOfList = paginate(filtered, list.page, PAGE_SIZE)

  const openForm = (tag: AdminTag | null) => {
    setEditing(tag)
    feedback.setError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    feedback.setError(null)
    setIsFormOpen(false)
  }

  const save = async (input: SaveTagInput) => {
    if (saveMutation.isPending) return
    // The list loads again after the save.
    const saved = await feedback.run(() => saveMutation.mutateAsync(input), {
      success: editing ? 'Đã cập nhật thẻ.' : 'Đã tạo thẻ.',
      failure: 'Không thể lưu thẻ.',
    })
    if (saved) setIsFormOpen(false)
  }

  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const toggleActive = async (tag: AdminTag) => {
    if (busyId !== null) return
    await feedback.run(() => toggleMutation.mutateAsync(tag), {
      success: (updated) => updated.isActive ? 'Thẻ đã được sử dụng lại.' : 'Thẻ đã ngừng sử dụng cho nội dung mới.',
      failure: 'Không thể đổi trạng thái thẻ.',
    })
  }

  return {
    filters: { keyword, status },
    submitFilters: list.submit,
    clearFilters: list.clear,
    changePage: list.changePage,
    isLoading: isInitialLoading(tagsQuery),
    error: getErrorMessage(tagsQuery.error, 'Không thể tải danh sách thẻ.'),
    retry: () => void tagsQuery.refetch(),
    ...pageOfList,
    busyId,
    toggleActive,
    // While the form is open, its error is shown inside the form instead of above the list.
    feedback: { error: isFormOpen ? null : feedback.error, success: feedback.success },
    form: { isOpen: isFormOpen, editing, isSaving: saveMutation.isPending, error: feedback.error, open: openForm, close: closeForm, save },
  }
}
