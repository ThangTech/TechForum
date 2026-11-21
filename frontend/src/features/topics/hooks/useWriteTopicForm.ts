import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isGuid } from '../../../shared/utils/ids'
import { useCategories } from '../../catalog/hooks/categories'
import { useTags } from '../../catalog/hooks/tags'
import { useDraft } from './drafts'
import { useMyTopicForEdit } from './topics'

// What the write form needs before it can open: the categories, the tags, the automatic draft and, when editing, the
// topic itself.
export const useWriteTopicForm = (id: string | undefined) => {
  const editingId = id ? id.toLowerCase() : null
  const isEditing = id !== undefined
  const isEditingIdValid = isGuid(editingId)

  const categoriesQuery = useCategories()
  const tagsQuery = useTags()
  const topicQuery = useMyTopicForEdit(editingId ?? '', isEditing && isEditingIdValid)
  const draftQuery = useDraft(editingId, !isEditing || isEditingIdValid)

  const categories = categoriesQuery.data
  const tags = tagsQuery.data
  const existingTopic = topicQuery.data
  const fallbackError = 'Không tải được dữ liệu biểu mẫu.'
  const error = isEditing && !isEditingIdValid
    ? 'Mã nội dung cần chỉnh sửa không hợp lệ.'
    : getErrorMessage(categoriesQuery.error, fallbackError) ??
      getErrorMessage(tagsQuery.error, fallbackError) ??
      getErrorMessage(topicQuery.error, fallbackError)

  const retry = () => {
    if (categoriesQuery.error) void categoriesQuery.refetch()
    if (tagsQuery.error) void tagsQuery.refetch()
    if (topicQuery.error) void topicQuery.refetch()
  }

  // The form waits for the draft too, so the offer to restore it is there from the first moment. A draft that cannot
  // be read does not stop the form.
  const isReady = categories !== undefined && tags !== undefined && (!isEditing || existingTopic !== undefined) &&
    !draftQuery.isLoading

  return {
    isEditing,
    error,
    retry,
    // Everything the editor needs, once it is all loaded.
    editor: isReady && !error
      ? { categories, tags, editingId, existingTopic: existingTopic ?? null, draft: draftQuery.data ?? null }
      : null,
  }
}
