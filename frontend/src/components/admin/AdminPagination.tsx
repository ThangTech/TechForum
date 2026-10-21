import { Button } from '@astryxdesign/core/Button'

export const AdminPagination = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  onChange,
}: {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onChange: (page: number) => void
}) => (
  <nav aria-label="Phân trang bảng dữ liệu" className="admin-pagination">
    <p>
      {totalItems === 0
        ? '0 kết quả'
        : page > totalPages
          ? `Trang này không có dữ liệu · ${totalItems} kết quả`
          : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} / ${totalItems} kết quả`}
    </p>
    <div>
      {page > Math.max(1, totalPages) ? (
        <Button
          label="Về trang có dữ liệu"
          onClick={() => onChange(Math.max(1, totalPages))}
          variant="secondary"
        />
      ) : (
        <>
          <Button
            isDisabled={page <= 1}
            label="Trước"
            onClick={() => onChange(page - 1)}
            variant="secondary"
          />
          <span>
            Trang {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            isDisabled={page >= totalPages}
            label="Sau"
            onClick={() => onChange(page + 1)}
            variant="secondary"
          />
        </>
      )}
    </div>
  </nav>
)
