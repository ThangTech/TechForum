import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import type { Category } from '../../api/categories'
import type { Tag } from '../../api/tags'

const maxTagCount = 5

interface TopicTitleFieldProps {
  error?: string
  title: string
  onTitleChange: (value: string) => void
}

// Ô tiêu đề lớn, không viền như trang soạn bài của Juejin; người viết tập trung vào nội dung trước.
export const TopicTitleField = ({ error, title, onTitleChange }: TopicTitleFieldProps) => (
  <TextField
    error={Boolean(error)}
    fullWidth
    helperText={error ?? `${title.length}/200`}
    id="topic-title"
    onChange={(event) => onTitleChange(event.target.value)}
    placeholder="Nhập tiêu đề…"
    slotProps={{
      htmlInput: { 'aria-label': 'Tiêu đề', maxLength: 200, style: { fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)' } },
    }}
    value={title}
    variant="standard"
  />
)

interface TopicMetadataFieldsProps {
  categories: Category[]
  categoryId: string
  errors: Record<string, string[]>
  summary: string
  tagIds: number[]
  tags: Tag[]
  onCategoryChange: (value: string) => void
  onSummaryChange: (value: string) => void
  onTagIdsChange: (ids: number[]) => void
}

// Cột cài đặt bên phải: chuyên mục, thẻ và tóm tắt.
export const TopicMetadataFields = ({
  categories,
  categoryId,
  errors,
  summary,
  tagIds,
  tags,
  onCategoryChange,
  onSummaryChange,
  onTagIdsChange,
}: TopicMetadataFieldsProps) => {
  const firstError = (field: string) => errors[field]?.[0]
  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id))

  return (
    <div className="grid gap-5">
      <TextField
        error={Boolean(firstError('categoryId'))}
        helperText={firstError('categoryId')}
        id="topic-category"
        label="Chuyên mục"
        onChange={(event) => onCategoryChange(event.target.value)}
        select
        slotProps={{ select: { native: true } }}
        value={categoryId}
      >
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </TextField>
      <Autocomplete
        getOptionDisabled={(option) => tagIds.length >= maxTagCount && !tagIds.includes(option.id)}
        getOptionLabel={(option) => `#${option.name}`}
        multiple
        noOptionsText="Không có thẻ phù hợp"
        onChange={(_, value) => onTagIdsChange(value.map((tag) => tag.id))}
        options={tags}
        renderInput={(parameters) => (
          <TextField
            {...parameters}
            error={Boolean(firstError('tagIds'))}
            helperText={firstError('tagIds') ?? `Chọn tối đa ${maxTagCount} thẻ (${tagIds.length}/${maxTagCount})`}
            label="Thẻ"
          />
        )}
        value={selectedTags}
      />
      <TextField
        error={Boolean(firstError('summary'))}
        helperText={firstError('summary') ?? `${summary.length}/500`}
        id="topic-summary"
        label="Tóm tắt"
        minRows={4}
        multiline
        onChange={(event) => onSummaryChange(event.target.value)}
        placeholder="Một hai câu để người đọc biết nội dung trước khi mở bài."
        slotProps={{ htmlInput: { maxLength: 500 } }}
        value={summary}
      />
    </div>
  )
}
