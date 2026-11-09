import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import type { Category } from '../../api/categories'

interface CategoryChipsProps {
  categories: Category[]
  error: string | null
  isLoading: boolean
  onRetry: () => void
  selectedId?: number
  onSelect: (id?: number) => void
}

const chipSx = (isSelected: boolean) => ({
  height: 32,
  borderRadius: '6px',
  px: 0.5,
  fontWeight: isSelected ? 600 : 500,
  bgcolor: isSelected ? 'primary.main' : 'var(--color-hover)',
  color: isSelected ? 'var(--color-on-primary)' : 'text.primary',
  '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'var(--color-border)' },
})

// A row of category buttons above the topic list: "Tất cả" and one button for each category.
// It scrolls sideways when there are more buttons than the width allows.
export const CategoryChips = ({ categories, error, isLoading, onRetry, selectedId, onSelect }: CategoryChipsProps) => {
  if (isLoading) {
    return (
      <Box aria-label="Đang tải chuyên mục" role="status" sx={{ mb: 2, display: 'flex', gap: 1 }}>
        {[72, 96, 88, 104].map((width) => <Skeleton height={32} key={width} sx={{ borderRadius: '6px' }} variant="rounded" width={width} />)}
      </Box>
    )
  }

  if (error) {
    return (
      <Typography color="text.secondary" role="alert" sx={{ mb: 2 }} variant="body2">
        Chưa tải được chuyên mục.{' '}
        <Button onClick={onRetry} size="small" sx={{ verticalAlign: 'baseline' }} variant="text">Thử lại</Button>
      </Typography>
    )
  }

  if (categories.length === 0) return null

  return (
    <Box
      aria-label="Chuyên mục"
      component="nav"
      sx={{ mb: 2, display: 'flex', gap: 1, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      <Chip
        aria-pressed={!selectedId}
        clickable
        label="Tất cả"
        onClick={() => onSelect()}
        sx={chipSx(!selectedId)}
      />
      {categories.map((category) => (
        <Chip
          aria-pressed={selectedId === category.id}
          clickable
          key={category.id}
          label={category.name}
          onClick={() => onSelect(category.id)}
          sx={{ ...chipSx(selectedId === category.id), flexShrink: 0 }}
          title={category.description || undefined}
        />
      ))}
    </Box>
  )
}
