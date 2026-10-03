import { Button } from '@astryxdesign/core/Button'
import { useState, type FormEvent } from 'react'
import type { TopicType } from '../../api/topics'

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApply(keyword.trim(), type || undefined)
  }

  return (
    <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="my-topic-keyword">Tìm nội dung của tôi</label>
      <input
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        id="my-topic-keyword"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm theo tiêu đề hoặc tóm tắt"
        value={keyword}
      />
      <label className="sr-only" htmlFor="my-topic-type">Loại nội dung</label>
      <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" id="my-topic-type" onChange={(event) => setType(event.target.value as TopicType | '')} value={type}>
        <option value="">Tất cả loại</option>
        <option value="article">Bài viết</option>
        <option value="question">Câu hỏi</option>
      </select>
      <Button label="Lọc nội dung" type="submit" variant="primary" />
    </form>
  )
}
