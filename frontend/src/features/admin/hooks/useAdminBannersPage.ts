import { useState } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import type { AdminBanner, SaveBannerInput } from '../types/adminBanners'
import {
  useAdminBanners,
  useDeleteAdminBanner,
  useSaveAdminBanner,
  useToggleAdminBanner,
  useUploadAdminBannerImage,
} from './bannerQueries'

// Everything the admin page of banners does: the list, the form to add or edit (with the picture upload), turning a
// banner on or off, and deleting one after a confirmation.
export const useAdminBannersPage = () => {
  const feedback = useActionFeedback()
  const [editing, setEditing] = useState<AdminBanner | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminBanner | null>(null)

  const bannersQuery = useAdminBanners()
  const saveMutation = useSaveAdminBanner(editing?.id ?? null)
  const toggleMutation = useToggleAdminBanner()
  const deleteMutation = useDeleteAdminBanner()
  const uploadMutation = useUploadAdminBannerImage()

  const openForm = (banner: AdminBanner | null) => {
    setEditing(banner)
    feedback.setError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    feedback.setError(null)
    setIsFormOpen(false)
  }

  const save = async (input: SaveBannerInput) => {
    if (saveMutation.isPending) return
    // The list and the slider of the home page load again after the save.
    const saved = await feedback.run(() => saveMutation.mutateAsync(input), {
      success: editing ? 'Đã cập nhật banner.' : 'Đã thêm banner.',
      failure: 'Không thể lưu banner.',
    })
    if (saved) setIsFormOpen(false)
  }

  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const toggleActive = async (banner: AdminBanner) => {
    if (busyId !== null) return
    await feedback.run(() => toggleMutation.mutateAsync(banner), {
      success: (updated) => updated.isActive ? 'Đã bật banner.' : 'Đã tắt banner, banner không còn hiện ở trang chủ.',
      failure: 'Không thể đổi trạng thái banner.',
    })
  }

  const confirmDelete = async () => {
    if (!deleting || deleteMutation.isPending) return
    await feedback.run(() => deleteMutation.mutateAsync(deleting), {
      success: 'Đã xóa banner.',
      failure: 'Không thể xóa banner.',
    })
    setDeleting(null)
  }

  return {
    banners: bannersQuery.data ?? [],
    isLoading: isInitialLoading(bannersQuery),
    error: getErrorMessage(bannersQuery.error, 'Không thể tải danh sách banner.'),
    retry: () => void bannersQuery.refetch(),
    busyId,
    toggleActive,
    // While the form is open, its error is shown inside the form instead of above the list.
    feedback: { error: isFormOpen ? null : feedback.error, success: feedback.success },
    form: {
      isOpen: isFormOpen,
      editing,
      isSaving: saveMutation.isPending,
      error: feedback.error,
      open: openForm,
      close: closeForm,
      save,
      uploadImage: (file: File) => uploadMutation.mutateAsync(file),
    },
    removal: {
      banner: deleting,
      isBusy: deleteMutation.isPending,
      ask: setDeleting,
      cancel: () => setDeleting(null),
      confirm: confirmDelete,
    },
  }
}
