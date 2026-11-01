import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'

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
}) => {
  const lastPage = Math.max(1, totalPages)

  const getSummary = () => {
    if (totalItems === 0) return '0 kết quả'
    if (page > totalPages) return `Trang này không có dữ liệu · ${totalItems} kết quả`
    return `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} / ${totalItems} kết quả`
  }

  return (
    <nav aria-label="Phân trang bảng dữ liệu" className="admin-pagination">
      <p>{getSummary()}</p>
      <div>
        {page > lastPage ? (
          <Button onClick={() => onChange(lastPage)} variant="outlined">Về trang có dữ liệu</Button>
        ) : (
          <Pagination color="primary" count={lastPage} onChange={(_, value) => onChange(value)} page={page} shape="rounded" />
        )}
      </div>
    </nav>
  )
}
