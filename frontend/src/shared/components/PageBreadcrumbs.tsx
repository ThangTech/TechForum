import Breadcrumbs from '@mui/material/Breadcrumbs'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  // Không có "to" nghĩa là trang đang xem: chữ thường, không bấm được.
  to?: string
}

const Chevron = () => (
  <svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const itemSx = { fontSize: '0.8125rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const

// Đường dẫn ở đầu trang: Trang chủ › Bài viết › Chuyên mục › Tên bài. Mục cuối là trang đang xem; tên dài bị cắt bằng "…"
// để thanh luôn nằm trên một dòng, kể cả trên điện thoại.
export const PageBreadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <Breadcrumbs
    aria-label="Đường dẫn trang"
    separator={<Chevron />}
    sx={{
      color: 'var(--color-quiet)',
      '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
      '& .MuiBreadcrumbs-li': { minWidth: 0 },
      '& .MuiBreadcrumbs-li:last-of-type': { flex: 1 },
      '& .MuiBreadcrumbs-separator': { mx: 0.75, flexShrink: 0 },
    }}
  >
    {items.map((item) => item.to
      ? (
          <MuiLink
            component={Link}
            key={`${item.label}-${item.to}`}
            sx={{ ...itemSx, display: 'block', color: 'var(--color-muted)', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
            to={item.to}
            underline="hover"
          >
            {item.label}
          </MuiLink>
        )
      : (
          <Typography aria-current="page" component="span" key={item.label} sx={{ ...itemSx, display: 'block', color: 'text.primary', fontWeight: 600 }} title={item.label}>
            {item.label}
          </Typography>
        ))}
  </Breadcrumbs>
)
