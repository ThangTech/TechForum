import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { ApiError } from '../../../shared/api/client'
import { toDisplayMediaHtml, toEditableMedia, toStoredMediaHtml } from '../../../shared/api/media'
import type { UploadedMedia } from '../../../shared/types/media'
import type { Category } from '../../catalog/types/categories'
import type { Tag } from '../../catalog/types/tags'
import { useContentCheck } from '../../moderation/hooks/moderation'
import type { Draft } from '../types/drafts'
import type { OwnTopic, TopicType } from '../types/topics'
import type { DraftSnapshot } from '../utils/draftSnapshot'
import { useDraftAutosave } from './useDraftAutosave'
import { useSaveTopic } from './topics'

export interface TopicEditorOptions {
  categories: Category[]
  // The automatic draft found when the form opened, or null.
  draft: Draft | null
  editingId: string | null
  existingTopic: OwnTopic | null
  requestedType: TopicType
  tags: Tag[]
}

// The write form: the fields, the preview, the check of banned words, the automatic draft and saving the topic.
export const useTopicEditor = ({ categories, draft, editingId, existingTopic, requestedType, tags }: TopicEditorOptions) => {
  const navigate = useNavigate()
  const saveMutation = useSaveTopic(editingId)
  const firstCategoryId = categories[0] ? String(categories[0].id) : ''
  // The values of an existing topic are copied once, when the form opens.
  const [title, setTitle] = useState(existingTopic?.title ?? '')
  const [summary, setSummary] = useState(existingTopic?.summary ?? '')
  const [bodyHtml, setBodyHtml] = useState(existingTopic ? toDisplayMediaHtml(existingTopic.bodyHtml) : '')
  const [type, setType] = useState<TopicType>(existingTopic?.type ?? requestedType)
  const [categoryId, setCategoryId] = useState(() => (existingTopic ? String(existingTopic.category.id) : firstCategoryId))
  const [tagIds, setTagIds] = useState<string[]>(existingTopic?.tags.map((tag) => tag.id) ?? [])
  const [media, setMedia] = useState<UploadedMedia[]>(existingTopic ? toEditableMedia(existingTopic.media) : [])
  const [isMediaUploading, setIsMediaUploading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [createdTopic, setCreatedTopic] = useState<OwnTopic | null>(null)
  // The editor reads its media list only when it starts, so it is started again after a draft is restored.
  const [editorVersion, setEditorVersion] = useState(0)
  const isSubmitting = saveMutation.isPending

  const snapshot = useMemo<DraftSnapshot>(() => ({
    title,
    summary,
    bodyHtml: toStoredMediaHtml(bodyHtml, media),
    type,
    categoryId: categoryId === '' ? null : categoryId,
    tagIds,
    mediaIds: media.map((item) => item.id),
  }), [title, summary, bodyHtml, media, type, categoryId, tagIds])

  const applyDraft = (found: Draft) => {
    setTitle(found.title)
    setSummary(found.summary)
    setBodyHtml(toDisplayMediaHtml(found.bodyHtml))
    if (!editingId) setType(found.type)
    if (categories.some((category) => category.id === found.categoryId)) setCategoryId(String(found.categoryId))
    setTagIds(found.tagIds.filter((tagId) => tags.some((tag) => tag.id === tagId)))
    setMedia(toEditableMedia(found.media))
    setEditorVersion((version) => version + 1)
  }

  // Nothing is saved after the topic was saved (the draft is gone then and must not come back) or while it is saved.
  const autosave = useDraftAutosave({
    draft,
    editingId,
    snapshot,
    isPaused: createdTopic !== null || isSubmitting,
    onRestore: applyDraft,
  })

  // The server says which words it would replace by *** when the content is posted.
  const contentCheck = useContentCheck({ title, summary, bodyHtml })

  const submit = async (publish: boolean) => {
    if (isSubmitting || isMediaUploading) return
    setSubmitError(null)
    setFieldErrors({})
    setCreatedTopic(null)

    try {
      setCreatedTopic(await saveMutation.mutateAsync({
        title,
        summary,
        bodyHtml: toStoredMediaHtml(bodyHtml, media),
        type,
        categoryId,
        tagIds,
        mediaIds: media.map((item) => item.id),
        publish,
      }))
      autosave.forgetAfterTopicSaved()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setSubmitError(requestError.message)
        setFieldErrors(requestError.fieldErrors)
      } else {
        setSubmitError(requestError instanceof Error ? requestError.message : 'Không thể lưu nội dung.')
      }
    }
  }

  // The form's own submit (the "save draft" button) saves without publishing.
  const saveAsDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit(false)
  }

  // After a save: back to "my content" when editing, or an empty form to write another topic.
  const afterSaved = () => {
    if (editingId) {
      navigate(appRoutes.myTopics)
      return
    }
    setCreatedTopic(null)
    setTitle('')
    setSummary('')
    setBodyHtml('')
    setType(requestedType)
    setCategoryId(firstCategoryId)
    setTagIds([])
    setMedia([])
    setIsPreviewOpen(false)
    setFieldErrors({})
  }

  // The preview shows the texts as readers will see them: with the banned words already replaced by ***. The server's
  // answer is only used when it is about the texts on the screen now.
  const cleaned = contentCheck.isCurrent ? contentCheck.result : undefined

  return {
    isEditing: editingId !== null,
    editorKey: `${editingId ?? 'create'}-${editorVersion}`,
    fields: {
      title, setTitle,
      summary, setSummary,
      bodyHtml, setBodyHtml,
      type, setType,
      categoryId, setCategoryId,
      tagIds, setTagIds,
      media, setMedia,
    },
    errors: fieldErrors,
    submitError,
    isSubmitting,
    isMediaUploading,
    setIsMediaUploading,
    publish: () => void submit(true),
    saveAsDraft,
    createdTopic,
    afterSaved,
    preview: {
      isOpen: isPreviewOpen,
      setIsOpen: setIsPreviewOpen,
      title: cleaned?.title ?? title,
      summary: cleaned?.summary ?? summary,
      bodyHtml: cleaned?.bodyHtml ?? bodyHtml,
    },
    contentCheckResult: contentCheck.result,
    draft: autosave,
  }
}
