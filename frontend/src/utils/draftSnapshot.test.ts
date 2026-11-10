import { describe, expect, it } from 'vitest'
import { getSnapshotKey, isBlankSnapshot, shouldRemoveDraft, shouldSaveDraft, type DraftSnapshot } from './draftSnapshot'

const snapshot = (overrides: Partial<DraftSnapshot> = {}): DraftSnapshot => ({
  title: '',
  summary: '',
  bodyHtml: '',
  type: 'article',
  categoryId: 'category-1',
  tagIds: [],
  mediaIds: [],
  ...overrides,
})

describe('getSnapshotKey', () => {
  it('is the same for the same content and different when something changes', () => {
    expect(getSnapshotKey(snapshot({ title: 'A' }))).toBe(getSnapshotKey(snapshot({ title: 'A' })))
    expect(getSnapshotKey(snapshot({ title: 'A' }))).not.toBe(getSnapshotKey(snapshot({ title: 'B' })))
    expect(getSnapshotKey(snapshot())).not.toBe(getSnapshotKey(snapshot({ type: 'question' })))
  })

  it('does not depend on the order of tags and media', () => {
    expect(getSnapshotKey(snapshot({ tagIds: ['t3', 't1', 't2'], mediaIds: ['b', 'a'] })))
      .toBe(getSnapshotKey(snapshot({ tagIds: ['t1', 't2', 't3'], mediaIds: ['a', 'b'] })))
  })
})

describe('isBlankSnapshot', () => {
  it('is true for an empty form and for the empty tags of the editor', () => {
    expect(isBlankSnapshot(snapshot())).toBe(true)
    expect(isBlankSnapshot(snapshot({ title: '  ', bodyHtml: '<p><br></p>' }))).toBe(true)
  })

  it('is false as soon as there is a title, a summary, text or a picture', () => {
    expect(isBlankSnapshot(snapshot({ title: 'A' }))).toBe(false)
    expect(isBlankSnapshot(snapshot({ summary: 'A' }))).toBe(false)
    expect(isBlankSnapshot(snapshot({ bodyHtml: '<p>Chữ</p>' }))).toBe(false)
    expect(isBlankSnapshot(snapshot({ bodyHtml: '<p><img src="/media/images/a.png"></p>' }))).toBe(false)
  })

  it('does not count the category or tags, which are chosen before anything is written', () => {
    expect(isBlankSnapshot(snapshot({ categoryId: 'category-3', tagIds: ['t1', 't2'] }))).toBe(true)
  })
})

describe('shouldSaveDraft', () => {
  const baseline = getSnapshotKey(snapshot())

  it('saves a form that was changed and not saved yet', () => {
    expect(shouldSaveDraft(snapshot({ title: 'Viết dở' }), baseline, baseline)).toBe(true)
  })

  it('does not save the same text twice', () => {
    const typed = snapshot({ title: 'Viết dở' })
    expect(shouldSaveDraft(typed, getSnapshotKey(typed), baseline)).toBe(false)
  })

  it('does not save an empty form or a form that was only opened', () => {
    expect(shouldSaveDraft(snapshot(), '', baseline)).toBe(false)
    const existing = snapshot({ title: 'Bài đã có', bodyHtml: '<p>Nội dung</p>' })
    expect(shouldSaveDraft(existing, '', getSnapshotKey(existing))).toBe(false)
  })

  it('saves a change to an existing topic', () => {
    const existing = snapshot({ title: 'Bài đã có', bodyHtml: '<p>Nội dung</p>' })
    expect(shouldSaveDraft({ ...existing, bodyHtml: '<p>Nội dung sửa</p>' }, '', getSnapshotKey(existing))).toBe(true)
  })
})

describe('shouldRemoveDraft', () => {
  const existing = snapshot({ title: 'Bài đã có', bodyHtml: '<p>Nội dung</p>' })
  const baseline = getSnapshotKey(existing)

  it('removes a saved draft when the form is emptied or back at its first state', () => {
    expect(shouldRemoveDraft(snapshot(), baseline, true)).toBe(true)
    expect(shouldRemoveDraft(existing, baseline, true)).toBe(true)
  })

  it('keeps it while there is still something typed, or when none was saved', () => {
    expect(shouldRemoveDraft({ ...existing, title: 'Đã sửa' }, baseline, true)).toBe(false)
    expect(shouldRemoveDraft(snapshot(), baseline, false)).toBe(false)
  })
})
