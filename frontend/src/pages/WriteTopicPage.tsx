import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getCategories, type Category } from '../api/categories'
import { getTags, type Tag } from '../api/tags'
import { toDisplayMediaHtml, toEditableMedia, toStoredMediaHtml, type UploadedMedia } from '../api/media'
import { createTopic, getMyTopic, updateTopic, type OwnTopic, type TopicType } from '../api/topics'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicEditorField } from '../components/topics/TopicEditorField'
import { TopicCreatedPanel } from '../components/topics/TopicCreatedPanel'
import { TopicMetadataFields } from '../components/topics/TopicMetadataFields'
import { appRoutes } from '../appRoutes'

export const WriteTopicPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedType = searchParams.get('type') === 'question' ? 'question' : 'article'
  const editingId = id ? Number(id) : null
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isOptionsLoading, setIsOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [type, setType] = useState<TopicType>(requestedType)
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMediaUploading, setIsMediaUploading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [createdTopic, setCreatedTopic] = useState<OwnTopic | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadOptions = async () => {
      setIsOptionsLoading(true)
      setOptionsError(null)
      try {
        if (id && (!Number.isInteger(editingId) || (editingId ?? 0) <= 0)) {
          throw new Error('Mã nội dung cần chỉnh sửa không hợp lệ.')
        }
        const [categoryResult, tagResult, topicResult] = await Promise.all([
          getCategories(controller.signal),
          getTags(controller.signal),
          editingId && Number.isInteger(editingId) && editingId > 0
            ? getMyTopic(editingId, controller.signal)
            : Promise.resolve(null),
        ])
        setCategories(categoryResult)
        setTags(tagResult)
        if (topicResult) {
          const existingMedia = toEditableMedia(topicResult.media)
          setTitle(topicResult.title)
          setSummary(topicResult.summary)
          setBodyHtml(toDisplayMediaHtml(topicResult.bodyHtml))
          setType(topicResult.type)
          setCategoryId(String(topicResult.category.id))
          setTagIds(topicResult.tags.map((tag) => tag.id))
          setMedia(existingMedia)
        } else if (categoryResult.length > 0) {
          setCategoryId(String(categoryResult[0].id))
          setType(requestedType)
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setOptionsError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu biểu mẫu.')
      } finally {
        if (!controller.signal.aborted) setIsOptionsLoading(false)
      }
    }

    void loadOptions()
    return () => controller.abort()
  }, [editingId, id, requestVersion, requestedType])

  const toggleTag = (tagId: number) => {
    setTagIds((current) => current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : current.length < 5 ? [...current, tagId] : current)
  }

  const submit = async (publish: boolean) => {
    if (isSubmitting || isMediaUploading) return
    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})
    setCreatedTopic(null)

    try {
      const input = {
        title,
        summary,
        bodyHtml: toStoredMediaHtml(bodyHtml, media),
        type,
        categoryId: Number(categoryId),
        tagIds,
        mediaIds: media.map((item) => item.id),
        publish,
      }
      setCreatedTopic(editingId
        ? await updateTopic(editingId, input)
        : await createTopic(input))
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

  const handleSuccessAction = () => {
    if (editingId) {
      navigate(appRoutes.myTopics)
      return
    }

    setCreatedTopic(null)
    setTitle('')
    setSummary('')
    setBodyHtml('')
    setType('article')
    setCategoryId(categories[0] ? String(categories[0].id) : '')
    setTagIds([])
    setMedia([])
    setIsPreviewOpen(false)
    setFieldErrors({})
  }

  if (createdTopic) {
    return (
      <TopicCreatedPanel
        actionLabel={editingId ? 'Về nội dung của tôi' : 'Soạn nội dung khác'}
        onReset={handleSuccessAction}
        topic={createdTopic}
      />
    )
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">P3 · {editingId ? 'Chỉnh sửa' : 'Soạn nội dung'}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          {editingId ? 'Chỉnh sửa nội dung' : 'Viết cho cộng đồng'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Có thể chèn ảnh PNG, JPEG, GIF, WebP tối đa 5 MB và video MP4, WebM tối đa 50 MB.
        </p>
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
            <TopicEditorField
              error={fieldErrors.bodyHtml?.[0] || fieldErrors.mediaIds?.[0]}
              initialMedia={media}
              key={editingId ?? 'create'}
              onChange={setBodyHtml}
              onMediaChange={setMedia}
              onUploadStateChange={setIsMediaUploading}
              value={bodyHtml}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Button
                isDisabled={isMediaUploading}
                label={isPreviewOpen ? 'Đóng xem trước' : 'Xem trước nội dung'}
                onClick={() => setIsPreviewOpen((current) => !current)}
                type="button"
                variant="secondary"
              />
              {isPreviewOpen && (
                <div
                  className="fr-view mt-4 rounded-lg border border-slate-200 bg-white p-5 text-base leading-8 text-slate-800 [&_img]:h-auto [&_img]:max-w-full [&_video]:block [&_video]:max-h-[70vh] [&_video]:w-full [&_video]:rounded-lg [&_video]:bg-black"
                  dangerouslySetInnerHTML={{ __html: toDisplayMediaHtml(bodyHtml) }}
                />
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <Button isDisabled={isSubmitting || isMediaUploading} label={isMediaUploading ? 'Đang tải media…' : isSubmitting ? 'Đang lưu…' : 'Lưu bản nháp'} type="submit" variant="secondary" />
              <Button isDisabled={isSubmitting || isMediaUploading} label={isMediaUploading ? 'Đang tải media…' : isSubmitting ? 'Đang xuất bản…' : 'Xuất bản'} onClick={() => void submit(true)} type="button" variant="primary" />
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
