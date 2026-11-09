import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { useState } from 'react'
import type { AdminBanner, SaveBannerInput } from '../api/adminBanners'
import { ApiError } from '../api/client'
import { AdminEmptyState } from '../components/admin/AdminEmptyState'
import { AdminFeedback } from '../components/admin/AdminFeedback'
import { AdminPageHeading } from '../components/admin/AdminPageHeading'
import { BannerAdminCard } from '../components/admin/BannerAdminCard'
import { BannerFormDialog } from '../components/admin/BannerFormDialog'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog'
import {
  useAdminBanners,
  useDeleteAdminBanner,
  useSaveAdminBanner,
  useToggleAdminBanner,
  useUploadAdminBannerImage,
} from '../queries/admin'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'

export const AdminBannersPage = () => {
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminBanner | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminBanner | null>(null)

  const bannersQuery = useAdminBanners()
  const saveMutation = useSaveAdminBanner(editing?.id ?? null)
  const toggleMutation = useToggleAdminBanner()
  const deleteMutation = useDeleteAdminBanner()
  const uploadMutation = useUploadAdminBannerImage()
  const banners = bannersQuery.data ?? []
  const isLoading = isInitialLoading(bannersQuery)
  const error = getErrorMessage(bannersQuery.error, 'Không thể tải danh sách banner.')
  const isSaving = saveMutation.isPending
  const busyId = toggleMutation.isPending ? toggleMutation.variables.id : null

  const openForm = (banner: AdminBanner | null) => {
    setEditing(banner)
    setActionError(null)
    setIsFormOpen(true)
  }

  const save = async (input: SaveBannerInput) => {
    if (isSaving) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      // The list and the slider of the home page load again after the save.
      await saveMutation.mutateAsync(input)
      setSuccessMessage(editing ? 'Đã cập nhật banner.' : 'Đã thêm banner.')
      setIsFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu banner.')
    }
  }

  const toggleActive = async (banner: AdminBanner) => {
    if (busyId !== null) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await toggleMutation.mutateAsync(banner)
      setSuccessMessage(updated.isActive ? 'Đã bật banner.' : 'Đã tắt banner, banner không còn hiện ở trang chủ.')
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể đổi trạng thái banner.')
    }
  }

  const confirmDelete = async () => {
    if (!deleting || deleteMutation.isPending) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await deleteMutation.mutateAsync(deleting)
      setSuccessMessage('Đã xóa banner.')
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể xóa banner.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="admin-page">
      <div>
        <AdminPageHeading
          actions={<Button onClick={() => openForm(null)} variant="contained">Thêm banner</Button>}
          description="Các ảnh trượt ở đầu trang chủ. Banner chỉ hiện khi đang bật và nằm trong khoảng thời gian đã đặt."
          eyebrow="Quản trị giao diện"
          title="Banner trang chủ"
        />

        <AdminFeedback error={isFormOpen ? null : actionError} success={successMessage} />

        <div>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải banner…"
            onRetry={() => void bannersQuery.refetch()}
          />
          {!isLoading && !error && banners.length === 0 && (
            <AdminEmptyState>Chưa có banner nào. Bấm "Thêm banner" để tạo banner đầu tiên.</AdminEmptyState>
          )}
          {!isLoading && !error && banners.length > 0 && (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách banner trang chủ</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Ảnh</TableCell>
                    <TableCell>Tiêu đề / Liên kết</TableCell>
                    <TableCell>Thứ tự</TableCell>
                    <TableCell>Thời gian hiển thị</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {banners.map((banner) => (
                    <BannerAdminCard
                      banner={banner}
                      busyId={busyId}
                      key={banner.id}
                      onDelete={setDeleting}
                      onEdit={openForm}
                      onToggleActive={(item) => void toggleActive(item)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <BannerFormDialog
          banner={editing}
          isBusy={isSaving}
          onClose={() => {
            setActionError(null)
            setIsFormOpen(false)
          }}
          onSubmit={(input) => void save(input)}
          onUploadImage={(file) => uploadMutation.mutateAsync(file)}
          requestError={actionError}
        />
      )}
      <ConfirmDialog
        confirmLabel="Xóa banner"
        description={`Banner "${deleting?.title ?? ''}" sẽ bị xóa cùng ảnh của nó. Việc này không hoàn tác được. Nếu chỉ muốn tạm ẩn, hãy dùng nút Tắt.`}
        isBusy={deleteMutation.isPending}
        isOpen={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Xóa banner này?"
      />
    </section>
  )
}
