import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { getCategories, type Category } from '../api/categories'
import { getTags, type Tag } from '../api/tags'
import { createTopic, type OwnTopic, type TopicType } from '../api/topics'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicEditorField } from '../components/topics/TopicEditorField'
import { TopicCreatedPanel } from '../components/topics/TopicCreatedPanel'
import { TopicMetadataFields } from '../components/topics/TopicMetadataFields'
import { hasFroalaKey } from '../config/froala'

export const WriteTopicPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isOptionsLoading, setIsOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [type, setType] = useState<TopicType>('article')
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [createdTopic, setCreatedTopic] = useState<OwnTopic | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadOptions = async () => {
      setIsOptionsLoading(true)
      setOptionsError(null)
      try {
        const [categoryResult, tagResult] = await Promise.all([
          getCategories(controller.signal),
          getTags(controller.signal),
        ])
        setCategories(categoryResult)
        setTags(tagResult)
        if (categoryResult.length > 0) setCategoryId(String(categoryResult[0].id))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setOptionsError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu biểu mẫu.')
      } finally {
        if (!controller.signal.aborted) setIsOptionsLoading(false)
      }
    }

    void loadOptions()
    return () => controller.abort()
  }, [requestVersion])

  const toggleTag = (tagId: number) => {
    setTagIds((current) => current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : current.length < 5 ? [...current, tagId] : current)
  }

  const submit = async (publish: boolean) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})
    setCreatedTopic(null)

    try {
      setCreatedTopic(await createTopic({
        title,
        summary,
        bodyHtml,
        type,
        categoryId: Number(categoryId),
        tagIds,
        publish,
      }))
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setSubmitError(requestError.message)
        setFieldErrors(requestError.fieldErrors)
      } else {
        setSubmitError(requestError instanceof Error ? requestError.message : 'Không thể lưu nội dung.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit(false)
  }

  if (createdTopic) {
    return <TopicCreatedPanel onReset={() => setCreatedTopic(null)} topic={createdTopic} />
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">P3 · Soạn nội dung</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Viết cho cộng đồng</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Ảnh và video tạm thời chưa khả dụng cho đến khi endpoint upload an toàn hoàn tất.
        </p>
        {!hasFroalaKey && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Froala đang chạy ở chế độ đánh giá có attribution vì chưa cấu hình VITE_FROALA_KEY.
          </p>
        )}

        <div className="mt-6">
          <AsyncStatePanel
            error={optionsError}
            isLoading={isOptionsLoading}
            loadingText="Đang tải biểu mẫu…"
            onRetry={() => setRequestVersion((version) => version + 1)}
          />
        </div>

        {!isOptionsLoading && !optionsError && (
          <form className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8" onSubmit={handleSubmit}>
            {submitError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}
            <TopicMetadataFields
              categories={categories}
              categoryId={categoryId}
              errors={fieldErrors}
              onCategoryChange={setCategoryId}
              onSummaryChange={setSummary}
              onTagToggle={toggleTag}
              onTitleChange={setTitle}
              onTypeChange={setType}
              summary={summary}
              tagIds={tagIds}
              tags={tags}
              title={title}
              type={type}
            />
            <TopicEditorField error={fieldErrors.bodyHtml?.[0]} onChange={setBodyHtml} value={bodyHtml} />
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <Button isDisabled={isSubmitting} label={isSubmitting ? 'Đang lưu…' : 'Lưu bản nháp'} type="submit" variant="secondary" />
              <Button isDisabled={isSubmitting} label={isSubmitting ? 'Đang xuất bản…' : 'Xuất bản'} onClick={() => void submit(true)} type="button" variant="primary" />
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
