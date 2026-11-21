import { useState } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { paginate } from '../../../shared/utils/paginate'
import { readChoice } from '../../../shared/utils/searchParams'
import type { AdminCategory, SaveCategoryInput } from '../types/adminCategories'
import { matchesCatalogFilter } from '../utils/catalogFilter'
import { useAdminCategories, useSaveAdminCategory, useToggleAdminCategory } from './categoryQueries'

const PAGE_SIZE = 15
export const CATEGORY_FILTER_KEYS = ['keyword', 'status'] as const

// Everything the admin page of categories does: the filtered list, the form to create or edit, and turning a
// category on or off. The page only draws what this hook gives.
export const useAdminCategoriesPage = () => {
  const list = useListParams()
  const keyword = list.read('keyword')
  const status = readChoice(list.params.get('status'), ['active', 'inactive'] as const)
  const feedback = useActionFeedback()
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const categoriesQuery = useAdminCategories()
  const saveMutation = useSaveAdminCategory(editing?.id ?? null)
  const toggleMutation = useToggleAdminCategory()

  const filtered = (categoriesQuery.data ?? []).filter((item) => matchesCatalogFilter(item, keyword, status))
  const pageOfList = paginate(filtered, list.page, PAGE_SIZE)

  const openForm = (category: AdminCategory | null) => {
    setEditing(category)
    feedback.setError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    feedback.setError(null)
    setIsFormOpen(false)
  }

  const save = async (input: SaveCategoryInput) => {
    if (saveMutation.isPending) return
    // The list loads again after the save.
    const saved = await feedback.run(() => saveMutation.mutateAsync(input), {
      success: editing ? 'Đã cập nhật chuyên mục.' : 'Đã tạo chuyên mục.',
      failure: 'Không thể lưu chuyên mục.',
    })
    if (saved) setIsFormOpen(false)
  }

  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const toggleActive = async (category: AdminCategory) => {
    if (busyId !== null) return
    await feedback.run(() => toggleMutation.mutateAsync(category), {
      success: (updated) => updated.isActive
        ? 'Chuyên mục đã được sử dụng lại.'
        : 'Chuyên mục đã ngừng sử dụng cho nội dung mới.',
      failure: 'Không thể đổi trạng thái chuyên mục.',
    })
  }

  return {
    filters: { keyword, status },
    submitFilters: list.submit,
    clearFilters: list.clear,
    changePage: list.changePage,
    isLoading: isInitialLoading(categoriesQuery),
    error: getErrorMessage(categoriesQuery.error, 'Không thể tải chuyên mục.'),
    retry: () => void categoriesQuery.refetch(),
    ...pageOfList,
    busyId,
    toggleActive,
    // While the form is open, its error is shown inside the form instead of above the list.
    feedback: { error: isFormOpen ? null : feedback.error, success: feedback.success },
    form: { isOpen: isFormOpen, editing, isSaving: saveMutation.isPending, error: feedback.error, open: openForm, close: closeForm, save },
  }
}
