import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
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
import { TopicMetadataFields, TopicTitleField } from '../components/topics/TopicMetadataFields'
import { WritingTips } from '../components/topics/WritingTips'
import { appRoutes } from '../appRoutes'

export const WriteTopicPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedType = searchParams.get('type') === 'question' ? 'question' : 'article'

  return <WriteTopicForm id={id} key={id ? `edit-${id}` : `create-${requestedType}`} requestedType={requestedType} />
}

interface WriteTopicFormProps {
  id?: string
  requestedType: TopicType
}

const WriteTopicForm = ({ id, requestedType }: WriteTopicFormProps) => {
  const navigate = useNavigate()
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
        if (controller.signal.aborted) return
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
    setType(requestedType)
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
      <div className="write-page">
        <h1 className="sr-only">{editingId ? 'Chỉnh sửa nội dung' : 'Viết cho cộng đồng'}</h1>
        <AsyncStatePanel
          error={optionsError}
          isLoading={isOptionsLoading}
          loadingText="Đang tải biểu mẫu…"
          onRetry={() => setRequestVersion((version) => version + 1)}
        />

        {!isOptionsLoading && !optionsError && (
          <form onSubmit={handleSubmit}>
            <div className="write-toolbar">
              <ToggleButtonGroup
                aria-label="Loại nội dung"
                disabled={Boolean(editingId)}
                exclusive
                onChange={(_, value: TopicType | null) => value && setType(value)}
                size="small"
                value={type}
              >
                <ToggleButton value="article">Bài viết</ToggleButton>
                <ToggleButton value="question">Câu hỏi</ToggleButton>
              </ToggleButtonGroup>
              <div className="write-toolbar__actions">
                <Button disabled={isMediaUploading} onClick={() => setIsPreviewOpen((current) => !current)} type="button" variant="text">
                  {isPreviewOpen ? 'Đóng xem trước' : 'Xem trước'}
                </Button>
                <Button disabled={isSubmitting || isMediaUploading} type="submit" variant="outlined">
                  {isMediaUploading ? 'Đang tải tệp…' : 'Lưu bản nháp'}
                </Button>
                <Button disabled={isSubmitting || isMediaUploading} loading={isSubmitting} onClick={() => void submit(true)} type="button" variant="contained">
                  Xuất bản
                </Button>
              </div>
            </div>

            {submitError && <p className="write-error" role="alert">{submitError}</p>}

            <div className="write-layout">
              <div className="write-main">
                <TopicTitleField error={fieldErrors.title?.[0]} onTitleChange={setTitle} title={title} />
                <TopicEditorField
                  error={fieldErrors.bodyHtml?.[0] || fieldErrors.mediaIds?.[0]}
                  initialMedia={media}
                  key={editingId ?? 'create'}
                  onChange={setBodyHtml}
                  onMediaChange={setMedia}
                  onUploadStateChange={setIsMediaUploading}
                  value={bodyHtml}
                />
                <p className="write-note">
                  Có thể chèn ảnh PNG, JPEG, GIF, WebP tối đa 5 MB và video MP4, WebM tối đa 50 MB.
                </p>
                {isPreviewOpen && (
                  <div
                    className="fr-view reading-content write-preview"
                    dangerouslySetInnerHTML={{ __html: toDisplayMediaHtml(bodyHtml) }}
                  />
                )}
              </div>
              <div className="write-side">
                <section aria-label="Cài đặt nội dung" className="surface-card write-settings">
                  <h2>Cài đặt</h2>
                  <TopicMetadataFields
                    categories={categories}
                    categoryId={categoryId}
                    errors={fieldErrors}
                    onCategoryChange={setCategoryId}
                    onSummaryChange={setSummary}
                    onTagIdsChange={setTagIds}
                    summary={summary}
                    tagIds={tagIds}
                    tags={tags}
                  />
                </section>
                <WritingTips type={type} />
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
