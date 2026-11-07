import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import type { Category } from '../api/categories'
import type { Tag } from '../api/tags'
import { toDisplayMediaHtml, toEditableMedia, toStoredMediaHtml, type UploadedMedia } from '../api/media'
import type { OwnTopic, TopicType } from '../api/topics'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicEditorField } from '../components/topics/TopicEditorField'
import { TopicCreatedPanel } from '../components/topics/TopicCreatedPanel'
import { TopicMetadataFields, TopicTitleField } from '../components/topics/TopicMetadataFields'
import { WritingTips } from '../components/topics/WritingTips'
import { appRoutes } from '../appRoutes'
import { useCategories } from '../queries/categories'
import { getErrorMessage } from '../queries/errorMessage'
import { useTags } from '../queries/tags'
import { useMyTopicForEdit, useSaveTopic } from '../queries/topics'

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

// Loads what the form needs: the categories, the tags and, when editing, the topic itself.
const WriteTopicForm = ({ id, requestedType }: WriteTopicFormProps) => {
  const editingId = id ? Number(id) : null
  const isEditing = id !== undefined
  const isEditingIdValid = editingId !== null && Number.isInteger(editingId) && editingId > 0

  const categoriesQuery = useCategories()
  const tagsQuery = useTags()
  const topicQuery = useMyTopicForEdit(editingId ?? 0, isEditing && isEditingIdValid)

  const categories = categoriesQuery.data
  const tags = tagsQuery.data
  const existingTopic = topicQuery.data
  const fallbackError = 'Không tải được dữ liệu biểu mẫu.'
  const optionsError = isEditing && !isEditingIdValid
    ? 'Mã nội dung cần chỉnh sửa không hợp lệ.'
    : getErrorMessage(categoriesQuery.error, fallbackError) ??
      getErrorMessage(tagsQuery.error, fallbackError) ??
      getErrorMessage(topicQuery.error, fallbackError)
  const isFormReady = categories !== undefined && tags !== undefined && (!isEditing || existingTopic !== undefined)

  const retry = () => {
    if (categoriesQuery.error) void categoriesQuery.refetch()
    if (tagsQuery.error) void tagsQuery.refetch()
    if (topicQuery.error) void topicQuery.refetch()
  }

  if (!isFormReady || optionsError) {
    return (
      <main className="main-area" id="main-content">
        <div className="write-page">
          <h1 className="sr-only">{isEditing ? 'Chỉnh sửa nội dung' : 'Viết cho cộng đồng'}</h1>
          <AsyncStatePanel
            error={optionsError}
            isLoading={!optionsError}
            loadingText="Đang tải biểu mẫu…"
            onRetry={retry}
          />
        </div>
      </main>
    )
  }

  return (
    <WriteTopicEditor
      categories={categories}
      editingId={editingId}
      existingTopic={existingTopic ?? null}
      requestedType={requestedType}
      tags={tags}
    />
  )
}

interface WriteTopicEditorProps {
  categories: Category[]
  editingId: number | null
  existingTopic: OwnTopic | null
  requestedType: TopicType
  tags: Tag[]
}

const WriteTopicEditor = ({ categories, editingId, existingTopic, requestedType, tags }: WriteTopicEditorProps) => {
  const navigate = useNavigate()
  const saveMutation = useSaveTopic(editingId)
  // The values of an existing topic are copied once, when the form opens.
  const [title, setTitle] = useState(existingTopic?.title ?? '')
  const [summary, setSummary] = useState(existingTopic?.summary ?? '')
  const [bodyHtml, setBodyHtml] = useState(existingTopic ? toDisplayMediaHtml(existingTopic.bodyHtml) : '')
  const [type, setType] = useState<TopicType>(existingTopic?.type ?? requestedType)
  const [categoryId, setCategoryId] = useState(() => {
    if (existingTopic) return String(existingTopic.category.id)
    return categories[0] ? String(categories[0].id) : ''
  })
  const [tagIds, setTagIds] = useState<number[]>(existingTopic?.tags.map((tag) => tag.id) ?? [])
  const [media, setMedia] = useState<UploadedMedia[]>(existingTopic ? toEditableMedia(existingTopic.media) : [])
  const [isMediaUploading, setIsMediaUploading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [createdTopic, setCreatedTopic] = useState<OwnTopic | null>(null)
  const isSubmitting = saveMutation.isPending

  const submit = async (publish: boolean) => {
    if (isSubmitting || isMediaUploading) return
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
      setCreatedTopic(await saveMutation.mutateAsync(input))
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setSubmitError(requestError.message)
        setFieldErrors(requestError.fieldErrors)
      } else {
        setSubmitError(requestError instanceof Error ? requestError.message : 'Không thể lưu nội dung.')
      }
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
      </div>
    </main>
  )
}
