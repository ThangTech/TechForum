import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import type { TopicType } from '../../api/topics'
import { Panel } from '../common/Panel'

interface OwnTopicFiltersProps {
  initialKeyword: string
  initialType?: TopicType
  onApply: (keyword: string, type?: TopicType) => void
}

export const OwnTopicFilters = ({
  initialKeyword,
  initialType,
  onApply,
}: OwnTopicFiltersProps) => {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [type, setType] = useState<TopicType | ''>(initialType ?? '')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onApply(keyword.trim(), type || undefined)
  }

  return (
    <Panel
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 2, display: 'grid', gap: 1.5, alignItems: 'center', gridTemplateColumns: { xs: '1fr', sm: '1fr 180px auto' }, overflow: 'visible' }}
    >
      <TextField
        id="my-topic-keyword"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm theo tiêu đề hoặc tóm tắt"
        slotProps={{ htmlInput: { 'aria-label': 'Tìm nội dung của tôi' } }}
        value={keyword}
      />
      <TextField
        id="my-topic-type"
        onChange={(event) => setType(event.target.value as TopicType | '')}
        select
        slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': 'Loại nội dung' } }}
        value={type}
      >
        <MenuItem value="">Tất cả loại</MenuItem>
        <MenuItem value="article">Bài viết</MenuItem>
        <MenuItem value="question">Câu hỏi</MenuItem>
      </TextField>
      <Button type="submit" variant="contained">Lọc nội dung</Button>
    </Panel>
  )
}
