import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import FroalaEditorComponent from 'react-froala-wysiwyg'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getCategories, type Category } from '../api/categories'
import { getTags, type Tag } from '../api/tags'
import { createTopic, type OwnTopic, type TopicType } from '../api/topics'

const froalaKey = import.meta.env.VITE_FROALA_KEY?.trim()

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

  const firstError = (field: string) => fieldErrors[field]?.[0]
  const editorConfig = {
    ...(froalaKey ? { key: froalaKey } : {}),
    attribution: true,
    charCounterMax: 100000,
    heightMin: 280,
    imageUpload: false,
    videoUpload: false,
    toolbarButtons: [
      'paragraphFormat', 'bold', 'italic', 'underline', 'strikeThrough',
      'formatOL', 'formatUL', 'quote', 'insertLink', 'insertHR', 'html',
    ],
  }

  if (createdTopic) {
    return (
      <main className="main-area" id="main-content">
        <div className="mx-auto w-[min(720px,calc(100%-40px))] py-12">
          <section className="rounded-xl border border-green-200 bg-white p-8 text-center" role="status">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">Đã lưu thành công</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-950">{createdTopic.title}</h1>
            <p className="mt-3 text-sm text-slate-600">
              {createdTopic.status === 'published' ? 'Nội dung đã được xuất bản.' : 'Bản nháp chỉ bạn mới có thể quản lý.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {createdTopic.status === 'published' && (
                <Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white" to={`/noi-dung/${createdTopic.id}`}>
                  Xem nội dung
                </Link>
              )}
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700" onClick={() => setCreatedTopic(null)} type="button">
                Soạn nội dung khác
              </button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="main-area" id="main-content">
      <div className="mx-auto w-[min(920px,calc(100%-40px))] py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">P3 · Soạn nội dung</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Viết cho cộng đồng</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Ảnh và video tạm thời chưa khả dụng cho đến khi endpoint upload an toàn hoàn tất.
        </p>
        {!froalaKey && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Froala đang chạy ở chế độ đánh giá có attribution vì chưa cấu hình VITE_FROALA_KEY.
          </p>
        )}

        {isOptionsLoading && <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải biểu mẫu…</div>}
        {!isOptionsLoading && optionsError && (
          <div className="mt-6 space-y-4 rounded-xl border border-red-200 bg-white p-8 text-center" role="alert">
            <p className="text-sm text-red-700">{optionsError}</p>
            <Button label="Thử lại" onClick={() => setRequestVersion((version) => version + 1)} variant="secondary" />
          </div>
        )}

        {!isOptionsLoading && !optionsError && (
          <form className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8" onSubmit={handleSubmit}>
            {submitError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-800" htmlFor="topic-type">Loại nội dung</label>
              <select className="rounded-lg border border-slate-300 px-3 py-2" id="topic-type" onChange={(event) => setType(event.target.value as TopicType)} value={type}>
                <option value="article">Bài viết</option>
                <option value="question">Câu hỏi</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-800" htmlFor="topic-title">Tiêu đề</label>
              <input className="rounded-lg border border-slate-300 px-3 py-2" id="topic-title" maxLength={200} onChange={(event) => setTitle(event.target.value)} value={title} />
              {firstError('title') && <p className="text-sm text-red-700">{firstError('title')}</p>}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-800" htmlFor="topic-summary">Tóm tắt</label>
              <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2" id="topic-summary" maxLength={500} onChange={(event) => setSummary(event.target.value)} value={summary} />
              {firstError('summary') && <p className="text-sm text-red-700">{firstError('summary')}</p>}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-800" htmlFor="topic-category">Chuyên mục</label>
              <select className="rounded-lg border border-slate-300 px-3 py-2" id="topic-category" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {firstError('categoryId') && <p className="text-sm text-red-700">{firstError('categoryId')}</p>}
            </div>
            <fieldset>
              <legend className="text-sm font-bold text-slate-800">Thẻ ({tagIds.length}/5)</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label className={tagIds.includes(tag.id) ? 'rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800' : 'rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700'} key={tag.id}>
                    <input checked={tagIds.includes(tag.id)} className="sr-only" disabled={!tagIds.includes(tag.id) && tagIds.length >= 5} onChange={() => toggleTag(tag.id)} type="checkbox" />
                    #{tag.name}
                  </label>
                ))}
              </div>
              {firstError('tagIds') && <p className="mt-2 text-sm text-red-700">{firstError('tagIds')}</p>}
            </fieldset>
            <div className="grid gap-2">
              <span className="text-sm font-bold text-slate-800">Nội dung</span>
              <FroalaEditorComponent config={editorConfig} model={bodyHtml} onModelChange={(value: string) => setBodyHtml(value)} tag="textarea" />
              {firstError('bodyHtml') && <p className="text-sm text-red-700">{firstError('bodyHtml')}</p>}
            </div>
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
