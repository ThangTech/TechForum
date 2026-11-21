import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useParams, useSearchParams } from 'react-router-dom'
import { toDisplayMediaHtml } from '../../../shared/api/media'
import { RichHtml } from '../../../shared/components/RichHtml'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { ProfanityNotice } from '../../moderation/components/ProfanityNotice'
import { TopicCreatedPanel } from '../components/TopicCreatedPanel'
import { TopicEditorField } from '../components/TopicEditorField'
import { TopicMetadataFields, TopicTitleField } from '../components/TopicMetadataFields'
import { WritingTips } from '../components/WritingTips'
import { useTopicEditor, type TopicEditorOptions } from '../hooks/useTopicEditor'
import { useWriteTopicForm } from '../hooks/useWriteTopicForm'
import type { TopicType } from '../types/topics'
import { formatDraftTime } from '../utils/draftStatus'
import { hasPreviewContent } from '../utils/previewContent'

export const WriteTopicPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedType = searchParams.get('type') === 'question' ? 'question' : 'article'

  return <WriteTopicForm id={id} key={id ? `edit-${id}` : `create-${requestedType}`} requestedType={requestedType} />
}

// Shows "loading" (or the error) until the form has everything it needs, then the editor.
const WriteTopicForm = ({ id, requestedType }: { id?: string; requestedType: TopicType }) => {
  const form = useWriteTopicForm(id)

  if (!form.editor) {
    return (
      <main className="main-area" id="main-content">
        <div className="write-page">
          <h1 className="sr-only">{form.isEditing ? 'Chỉnh sửa nội dung' : 'Viết cho cộng đồng'}</h1>
          <AsyncStatePanel error={form.error} isLoading={!form.error} loadingText="Đang tải biểu mẫu…" onRetry={form.retry} />
        </div>
      </main>
    )
  }

  return <WriteTopicEditor {...form.editor} requestedType={requestedType} />
}

const WriteTopicEditor = (options: TopicEditorOptions) => {
  const editor = useTopicEditor(options)
  const { fields, preview, draft } = editor
  const isBusy = editor.isSubmitting || editor.isMediaUploading

  if (editor.createdTopic) {
    return (
      <TopicCreatedPanel
        actionLabel={editor.isEditing ? 'Về nội dung của tôi' : 'Soạn nội dung khác'}
        onReset={editor.afterSaved}
        topic={editor.createdTopic}
      />
    )
  }

  return (
    <main className="main-area" id="main-content">
      <div className="write-page">
        <h1 className="sr-only">{editor.isEditing ? 'Chỉnh sửa nội dung' : 'Viết cho cộng đồng'}</h1>
        <form onSubmit={editor.saveAsDraft}>
          <div className="write-toolbar">
            <ToggleButtonGroup
              aria-label="Loại nội dung"
              disabled={editor.isEditing}
              exclusive
              onChange={(_, value: TopicType | null) => value && fields.setType(value)}
              size="small"
              value={fields.type}
            >
              <ToggleButton value="article">Bài viết</ToggleButton>
              <ToggleButton value="question">Câu hỏi</ToggleButton>
            </ToggleButtonGroup>
            <div className="write-toolbar__actions">
              <span aria-live="polite" className="write-draft-status" role="status">{draft.statusText}</span>
              <Button disabled={isBusy} type="submit" variant="outlined">
                {editor.isMediaUploading ? 'Đang tải tệp…' : 'Lưu bản nháp'}
              </Button>
              <Button disabled={isBusy} loading={editor.isSubmitting} onClick={editor.publish} type="button" variant="contained">
                Xuất bản
              </Button>
            </div>
          </div>

          {draft.pendingDraft && (
            <Alert
              action={(
                <>
                  <Button color="inherit" onClick={draft.restore} size="small" type="button">Khôi phục</Button>
                  <Button color="inherit" onClick={draft.discard} size="small" type="button">Bỏ bản nháp</Button>
                </>
              )}
              severity="info"
              sx={{ mb: 2 }}
            >
              Bạn có nội dung viết dở được tự lưu lúc {formatDraftTime(draft.pendingDraft.updatedAtUtc, true)}.
              Khôi phục để viết tiếp, hoặc bỏ nếu không cần.
            </Alert>
          )}

          {editor.submitError && <p className="write-error" role="alert">{editor.submitError}</p>}

          <div className="write-layout">
            <div className="write-main">
              <ProfanityNotice result={editor.contentCheckResult} />

              <Tabs
                aria-label="Chế độ soạn thảo"
                onChange={(_, value: 'edit' | 'preview') => preview.setIsOpen(value === 'preview')}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
                value={preview.isOpen ? 'preview' : 'edit'}
              >
                <Tab aria-controls="write-edit-panel" id="write-tab-edit" label="Soạn thảo" value="edit" />
                <Tab aria-controls="write-preview-panel" id="write-tab-preview" label="Xem trước" value="preview" />
              </Tabs>

              {/* The editor is only hidden, not removed, while the preview is open: it keeps what was typed and the
                  files that are still uploading. */}
              <div aria-labelledby="write-tab-edit" className="write-panel" hidden={preview.isOpen} id="write-edit-panel" role="tabpanel">
                <TopicTitleField error={editor.errors.title?.[0]} onTitleChange={fields.setTitle} title={fields.title} />
                <TopicEditorField
                  error={editor.errors.bodyHtml?.[0] || editor.errors.mediaIds?.[0]}
                  initialMedia={fields.media}
                  key={editor.editorKey}
                  onChange={fields.setBodyHtml}
                  onMediaChange={fields.setMedia}
                  onUploadStateChange={editor.setIsMediaUploading}
                  value={fields.bodyHtml}
                />
                <p className="write-note">
                  Có thể chèn ảnh PNG, JPEG, GIF, WebP tối đa 5 MB và video MP4, WebM tối đa 50 MB.
                </p>
              </div>

              {preview.isOpen && (
                <div aria-labelledby="write-tab-preview" className="write-panel" id="write-preview-panel" role="tabpanel">
                  <p className="write-note">Đây là cách nội dung hiển thị cho người đọc. Nội dung chưa được lưu.</p>
                  <h2 className="write-preview__title">{preview.title.trim() || 'Chưa có tiêu đề'}</h2>
                  {preview.summary.trim() && <p className="write-preview__summary">{preview.summary.trim()}</p>}
                  {hasPreviewContent(fields.bodyHtml) ? (
                    <RichHtml className="fr-view reading-content write-preview" html={toDisplayMediaHtml(preview.bodyHtml)} />
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
                  categories={options.categories}
                  categoryId={fields.categoryId}
                  errors={editor.errors}
                  onCategoryChange={fields.setCategoryId}
                  onSummaryChange={fields.setSummary}
                  onTagIdsChange={fields.setTagIds}
                  summary={fields.summary}
                  tagIds={fields.tagIds}
                  tags={options.tags}
                />
              </section>
              <WritingTips type={fields.type} />
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
