import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api/client'
import { maxChosenSkills, type SkillTag } from '../../api/profiles'
import type { Tag } from '../../api/tags'
import { useMySkills, useSaveMySkills } from '../../queries/profiles'
import { useTags } from '../../queries/tags'
import { Panel } from '../common/Panel'
import { useToast } from '../feedback/toastState'
import { hasSameIds } from './skillSelection'

interface SkillsEditorProps {
  tags: Tag[]
  // The skills that are saved on the server.
  saved: SkillTag[]
}

const SkillsEditor = ({ tags, saved }: SkillsEditorProps) => {
  const saveSkills = useSaveMySkills()
  const { showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  // A saved skill whose tag was turned off is not in the list of tags any more, so it is dropped here.
  const [selected, setSelected] = useState<Tag[]>(() =>
    tags.filter((tag) => saved.some((skill) => skill.tagId === tag.id)))
  const isFull = selected.length >= maxChosenSkills
  const hasChanged = !hasSameIds(selected.map((tag) => tag.id), saved.map((skill) => skill.tagId))

  const save = async () => {
    setError(null)
    try {
      const result = await saveSkills.mutateAsync(selected.map((tag) => tag.id))
      showToast(result.length === 0 ? 'Đã xóa hết kỹ năng.' : 'Đã lưu kỹ năng.')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể lưu kỹ năng lúc này.')
    }
  }

  return (
    <>
      <Autocomplete
        disableCloseOnSelect
        getOptionDisabled={(option) => isFull && !selected.some((tag) => tag.id === option.id)}
        getOptionKey={(option) => option.id}
        getOptionLabel={(option) => `#${option.name}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        multiple
        noOptionsText="Không tìm thấy thẻ phù hợp."
        onChange={(_event, value) => setSelected(value)}
        options={tags}
        renderInput={(params) => (
          <TextField
            {...params}
            helperText={`Chọn từ các thẻ có sẵn. Đã chọn ${selected.length}/${maxChosenSkills}.`}
            label="Kỹ năng"
            placeholder={selected.length === 0 ? 'Gõ để tìm thẻ, ví dụ React' : ''}
          />
        )}
        renderValue={(value, getItemProps) => value.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index })
          return <Chip {...itemProps} color="primary" key={key} label={`#${option.name}`} size="small" variant="outlined" />
        })}
        sx={{ mt: 2.5 }}
        value={selected}
      />
      {error && <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{error}</Typography>}
      <Stack direction="row" sx={{ mt: 2.5, gap: 1.5, flexWrap: 'wrap' }}>
        <Button disabled={!hasChanged} loading={saveSkills.isPending} onClick={() => void save()} variant="contained">Lưu kỹ năng</Button>
        {hasChanged && <Button disabled={saveSkills.isPending} onClick={() => setSelected(tags.filter((tag) => saved.some((skill) => skill.tagId === tag.id)))} variant="outlined">Hoàn tác</Button>}
      </Stack>
    </>
  )
}

// The skills that the member shows on their profile. They are chosen from the tags that already exist; the member can
// add or remove them at any time. The profile also shows the tags that the member uses most in their public content.
export const SkillsForm = () => {
  const tagsQuery = useTags()
  const skillsQuery = useMySkills()
  const isLoading = tagsQuery.isPending || skillsQuery.isPending
  const hasError = tagsQuery.isError || skillsQuery.isError

  return (
    <Panel component="section" sx={{ p: 3, overflow: 'visible' }}>
      <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 800 }}>Kỹ năng</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">
        Kỹ năng hiện trên hồ sơ công khai của bạn. Ngoài các kỹ năng bạn chọn, hồ sơ còn tự thêm các thẻ bạn dùng nhiều trong nội dung đã đăng.
      </Typography>
      {isLoading && !hasError && <Skeleton height={56} sx={{ mt: 2.5 }} variant="rounded" />}
      {hasError && (
        <Typography color="error" role="alert" sx={{ mt: 2.5 }} variant="body2">
          Không tải được danh sách kỹ năng.{' '}
          <Button onClick={() => { void tagsQuery.refetch(); void skillsQuery.refetch() }} size="small">Thử lại</Button>
        </Typography>
      )}
      {tagsQuery.data && skillsQuery.data && (
        <SkillsEditor
          key={skillsQuery.data.map((skill) => skill.tagId).join(',')}
          saved={skillsQuery.data}
          tags={tagsQuery.data}
        />
      )}
    </Panel>
  )
}
