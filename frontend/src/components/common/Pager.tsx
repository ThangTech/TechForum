import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface PagerProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  // Name of the navigation area for screen readers, for example "Phân trang báo cáo".
  label?: string
}

// "Previous page", "Page x of y" and "Next page". It shows nothing when there is only one page.
export const Pager = ({ page, totalPages, onChange, label }: PagerProps) => {
  if (totalPages <= 1) return null

  return (
    <Stack
      aria-label={label}
      component="nav"
      direction="row"
      sx={{ mt: 2.5, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
    >
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)} variant="outlined">Trang trước</Button>
      <Typography color="text.secondary" component="span" variant="body2">Trang {page}/{totalPages}</Typography>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)} variant="outlined">Trang sau</Button>
    </Stack>
  )
}
