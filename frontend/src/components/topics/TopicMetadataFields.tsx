import type { Category } from '../../api/categories'
import type { Tag } from '../../api/tags'
import type { TopicType } from '../../api/topics'

interface TopicMetadataFieldsProps {
  categories: Category[]
  categoryId: string
  errors: Record<string, string[]>
  summary: string
  tagIds: number[]
  tags: Tag[]
  title: string
  type: TopicType
  onCategoryChange: (value: string) => void
  onSummaryChange: (value: string) => void
  onTagToggle: (id: number) => void
  onTitleChange: (value: string) => void
  onTypeChange: (value: TopicType) => void
}

export const TopicMetadataFields = ({
  categories,
  categoryId,
  errors,
  summary,
  tagIds,
  tags,
  title,
  type,
  onCategoryChange,
  onSummaryChange,
  onTagToggle,
  onTitleChange,
  onTypeChange,
}: TopicMetadataFieldsProps) => {
  const firstError = (field: string) => errors[field]?.[0]

  return (
    <>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-slate-800" htmlFor="topic-type">Loại nội dung</label>
        <select className="rounded-lg border border-slate-300 px-3 py-2" id="topic-type" onChange={(event) => onTypeChange(event.target.value as TopicType)} value={type}>
          <option value="article">Bài viết</option>
          <option value="question">Câu hỏi</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-slate-800" htmlFor="topic-title">Tiêu đề</label>
        <input className="rounded-lg border border-slate-300 px-3 py-2" id="topic-title" maxLength={200} onChange={(event) => onTitleChange(event.target.value)} value={title} />
        {firstError('title') && <p className="text-sm text-red-700">{firstError('title')}</p>}
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-slate-800" htmlFor="topic-summary">Tóm tắt</label>
        <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2" id="topic-summary" maxLength={500} onChange={(event) => onSummaryChange(event.target.value)} value={summary} />
        {firstError('summary') && <p className="text-sm text-red-700">{firstError('summary')}</p>}
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-slate-800" htmlFor="topic-category">Chuyên mục</label>
        <select className="rounded-lg border border-slate-300 px-3 py-2" id="topic-category" onChange={(event) => onCategoryChange(event.target.value)} value={categoryId}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {firstError('categoryId') && <p className="text-sm text-red-700">{firstError('categoryId')}</p>}
      </div>
      <fieldset>
        <legend className="text-sm font-bold text-slate-800">Thẻ ({tagIds.length}/5)</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label className={tagIds.includes(tag.id) ? 'rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800' : 'rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700'} key={tag.id}>
              <input checked={tagIds.includes(tag.id)} className="sr-only" disabled={!tagIds.includes(tag.id) && tagIds.length >= 5} onChange={() => onTagToggle(tag.id)} type="checkbox" />
              #{tag.name}
            </label>
          ))}
        </div>
        {firstError('tagIds') && <p className="mt-2 text-sm text-red-700">{firstError('tagIds')}</p>}
      </fieldset>
    </>
  )
}
