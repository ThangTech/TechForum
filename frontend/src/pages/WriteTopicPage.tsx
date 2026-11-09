import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RichHtml } from '../components/common/RichHtml'
import { useDebounce } from '../hooks/useDebounce'
import { ProfanityNotice } from '../components/moderation/ProfanityNotice'
import { useContentCheck } from '../queries/moderation'
import { ApiError } from '../api/client'
import type { Category } from '../api/categories'
import type { Draft } from '../api/drafts'
import type { Tag } from '../api/tags'
import { toDisplayMediaHtml, toEditableMedia, toStoredMediaHtml, type UploadedMedia } from '../api/media'
import type { OwnTopic, TopicType } from '../api/topics'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicEditorField } from '../components/topics/TopicEditorField'
import { TopicCreatedPanel } from '../components/topics/TopicCreatedPanel'
import { TopicMetadataFields, TopicTitleField } from '../components/topics/TopicMetadataFields'
import { WritingTips } from '../components/topics/WritingTips'
import { appRoutes } from '../appRoutes'
import { getSnapshotKey, shouldRemoveDraft, shouldSaveDraft, type DraftSnapshot } from '../utils/draftSnapshot'
import { hasPreviewContent } from '../utils/previewContent'
import { useCategories } from '../queries/categories'
import { useDeleteDraft, useDraft, useSaveDraft } from '../queries/drafts'
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
  const draftQuery = useDraft(editingId, !isEditing || isEditingIdValid)

  const categories = categoriesQuery.data
  const tags = tagsQuery.data
  const existingTopic = topicQuery.data
  const fallbackError = 'Không tải được dữ liệu biểu mẫu.'
  const optionsError = isEditing && !isEditingIdValid
    ? 'Mã nội dung cần chỉnh sửa không hợp lệ.'
    : getErrorMessage(categoriesQuery.error, fallbackError) ??
      getErrorMessage(tagsQuery.error, fallbackError) ??
      getErrorMessage(topicQuery.error, fallbackError)
  // The form waits for the draft too, so the offer to restore it is there from the first moment. A draft that cannot
  // be read does not stop the form.
  const isFormReady = categories !== undefined && tags !== undefined && (!isEditing || existingTopic !== undefined) &&
    !draftQuery.isLoading

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
      draft={draftQuery.data ?? null}
      editingId={editingId}
      existingTopic={existingTopic ?? null}
      requestedType={requestedType}
      tags={tags}
    />
  )
}

interface WriteTopicEditorProps {
  categories: Category[]
  // The automatic draft found when the form opened, or null.
  draft: Draft | null
  editingId: number | null
  existingTopic: OwnTopic | null
  requestedType: TopicType
  tags: Tag[]
}

const WriteTopicEditor = ({ categories, draft, editingId, existingTopic, requestedType, tags }: WriteTopicEditorProps) => {
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

  // ---- Automatic draft: the form is saved by itself 3 seconds after the member stops typing.
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(draft)
  const [editorVersion, setEditorVersion] = useState(0)
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({ kind: 'idle' })
  const { mutate: saveDraftNow, isPending: isSavingDraft } = useSaveDraft(editingId)
  const { mutate: removeDraftNow, isPending: isRemovingDraft } = useDeleteDraft(editingId)

  const snapshot = useMemo<DraftSnapshot>(() => ({
    title,
    summary,
    bodyHtml: toStoredMediaHtml(bodyHtml, media),
    type,
    categoryId: categoryId === '' ? null : Number(categoryId),
    tagIds,
    mediaIds: media.map((item) => item.id),
  }), [title, summary, bodyHtml, media, type, categoryId, tagIds])
  // The state of the form when it opened: the saved topic, or an empty form. It has nothing to save.
  const [baselineKey] = useState(() => getSnapshotKey(snapshot))
  const [lastSavedKey, setLastSavedKey] = useState(baselineKey)
  const [lastFailedKey, setLastFailedKey] = useState<string | null>(null)
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const debouncedSnapshot = useDebounce(snapshot, AUTO_SAVE_DELAY_MS)
  // The server says which words it would replace by *** when the content is posted.
  const contentCheck = useContentCheck({ title, summary, bodyHtml })
  // Nothing is saved while the member still has to choose about the draft that was found, after the topic was saved
  // (the draft is gone then and must not come back) or while the topic is being saved.
  const canAutoSave = pendingDraft === null && createdTopic === null && !isSubmitting
  const hasUnsavedChanges = canAutoSave && shouldSaveDraft(snapshot, lastSavedKey, baselineKey)

  useEffect(() => {
    if (!canAutoSave || isSavingDraft || isRemovingDraft) return
    // The debounced value is older than the form while the member is typing or has just restored a draft. It is
    // saved only when it is the same as what the form holds now.
    if (debouncedSnapshot !== snapshot) return

    if (shouldRemoveDraft(debouncedSnapshot, baselineKey, hasSavedDraft)) {
      // Done or failed, the next change decides again; the state is changed when the answer arrives.
      removeDraftNow(undefined, {
        onSettled: () => {
          setHasSavedDraft(false)
          setLastSavedKey(baselineKey)
          setDraftStatus({ kind: 'idle' })
        },
      })
      return
    }

    const key = getSnapshotKey(debouncedSnapshot)
    // After a failure the same text is not tried again at once; the next change tries again.
    if (!shouldSaveDraft(debouncedSnapshot, lastSavedKey, baselineKey) || key === lastFailedKey) return

    saveDraftNow(debouncedSnapshot, {
      onSuccess: (saved) => {
        setLastSavedKey(key)
        setLastFailedKey(null)
        setHasSavedDraft(true)
        setDraftStatus({ kind: 'saved', at: saved.updatedAtUtc })
      },
      onError: () => {
        setLastFailedKey(key)
        setDraftStatus({ kind: 'error' })
      },
    })
  }, [
    baselineKey, canAutoSave, debouncedSnapshot, hasSavedDraft, isRemovingDraft, isSavingDraft,
    lastFailedKey, lastSavedKey, removeDraftNow, saveDraftNow, snapshot,
  ])

  // Closing or reloading the page with text that is not saved yet asks for a confirmation.
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const restoreDraft = () => {
    if (!pendingDraft) return
    setTitle(pendingDraft.title)
    setSummary(pendingDraft.summary)
    setBodyHtml(toDisplayMediaHtml(pendingDraft.bodyHtml))
    if (!editingId) setType(pendingDraft.type)
    if (categories.some((category) => category.id === pendingDraft.categoryId)) {
      setCategoryId(String(pendingDraft.categoryId))
    }
    setTagIds(pendingDraft.tagIds.filter((tagId) => tags.some((tag) => tag.id === tagId)))
    setMedia(toEditableMedia(pendingDraft.media))
    // The editor reads its media list only when it starts, so it is started again with the restored files.
    setEditorVersion((version) => version + 1)
    setHasSavedDraft(true)
    setLastSavedKey('')
    setPendingDraft(null)
  }

  const discardDraft = () => {
    removeDraftNow()
    setPendingDraft(null)
  }

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
      // The API removed the draft when it saved the topic.
      setHasSavedDraft(false)
      setLastSavedKey(baselineKey)
      setDraftStatus({ kind: 'idle' })
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

  // The preview shows the texts as readers will see them: with the banned words already replaced by ***. The server's
  // answer is only used when it is about the texts on the screen now.
  const cleaned = contentCheck.isCurrent ? contentCheck.result : undefined
  const previewTitle = cleaned?.title ?? title
  const previewSummary = cleaned?.summary ?? summary
  const previewBodyHtml = cleaned?.bodyHtml ?? bodyHtml

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
              <span aria-live="polite" className="write-draft-status" role="status">{getDraftStatusText(isSavingDraft ? { kind: 'saving' } : draftStatus)}</span>
              <Button disabled={isSubmitting || isMediaUploading} type="submit" variant="outlined">
                {isMediaUploading ? 'Đang tải tệp…' : 'Lưu bản nháp'}
              </Button>
              <Button disabled={isSubmitting || isMediaUploading} loading={isSubmitting} onClick={() => void submit(true)} type="button" variant="contained">
                Xuất bản
              </Button>
            </div>
          </div>

          {pendingDraft && (
            <Alert
              action={(
                <>
                  <Button color="inherit" onClick={restoreDraft} size="small" type="button">Khôi phục</Button>
                  <Button color="inherit" onClick={discardDraft} size="small" type="button">Bỏ bản nháp</Button>
                </>
              )}
              severity="info"
              sx={{ mb: 2 }}
            >
              Bạn có nội dung viết dở được tự lưu lúc {formatDraftTime(pendingDraft.updatedAtUtc, true)}.
              Khôi phục để viết tiếp, hoặc bỏ nếu không cần.
            </Alert>
          )}

          {submitError && <p className="write-error" role="alert">{submitError}</p>}

          <div className="write-layout">
            <div className="write-main">
              <ProfanityNotice result={contentCheck.result} />

              <Tabs
                aria-label="Chế độ soạn thảo"
                onChange={(_, value: 'edit' | 'preview') => setIsPreviewOpen(value === 'preview')}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
                value={isPreviewOpen ? 'preview' : 'edit'}
              >
                <Tab aria-controls="write-edit-panel" id="write-tab-edit" label="Soạn thảo" value="edit" />
                <Tab aria-controls="write-preview-panel" id="write-tab-preview" label="Xem trước" value="preview" />
              </Tabs>

              {/* The editor is only hidden, not removed, while the preview is open: it keeps what was typed and the
                  files that are still uploading. */}
              <div aria-labelledby="write-tab-edit" className="write-panel" hidden={isPreviewOpen} id="write-edit-panel" role="tabpanel">
                <TopicTitleField error={fieldErrors.title?.[0]} onTitleChange={setTitle} title={title} />
                <TopicEditorField
                  error={fieldErrors.bodyHtml?.[0] || fieldErrors.mediaIds?.[0]}
                  initialMedia={media}
                  key={`${editingId ?? 'create'}-${editorVersion}`}
                  onChange={setBodyHtml}
                  onMediaChange={setMedia}
                  onUploadStateChange={setIsMediaUploading}
                  value={bodyHtml}
                />
                <p className="write-note">
                  Có thể chèn ảnh PNG, JPEG, GIF, WebP tối đa 5 MB và video MP4, WebM tối đa 50 MB.
                </p>
              </div>

              {isPreviewOpen && (
                <div aria-labelledby="write-tab-preview" className="write-panel" id="write-preview-panel" role="tabpanel">
                  <p className="write-note">Đây là cách nội dung hiển thị cho người đọc. Nội dung chưa được lưu.</p>
                  <h2 className="write-preview__title">{previewTitle.trim() || 'Chưa có tiêu đề'}</h2>
                  {previewSummary.trim() && <p className="write-preview__summary">{previewSummary.trim()}</p>}
                  {hasPreviewContent(bodyHtml) ? (
                    <RichHtml
                      className="fr-view reading-content write-preview"
                      html={toDisplayMediaHtml(previewBodyHtml)}
                    />
                  ) : (
                    <p className="write-note">Chưa có nội dung để xem trước. Hãy quay lại tab Soạn thảo để viết.</p>
                  )}
                </div>
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

// The form is saved this long after the last key press.
const AUTO_SAVE_DELAY_MS = 3000

type DraftStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'error' }

const formatDraftTime = (iso: string, withDate = false): string => {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return withDate ? `${time} ngày ${date.toLocaleDateString('vi-VN')}` : time
}

const getDraftStatusText = (status: DraftStatus): string => {
  if (status.kind === 'saving') return 'Đang tự lưu…'
  if (status.kind === 'saved') return `Đã tự lưu lúc ${formatDraftTime(status.at)}`
  if (status.kind === 'error') return 'Chưa tự lưu được, sẽ thử lại khi bạn gõ tiếp'
  return ''
}
