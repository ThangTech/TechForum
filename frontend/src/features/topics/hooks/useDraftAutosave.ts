import { useEffect, useState } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { Draft, DraftStatus } from '../types/drafts'
import { getSnapshotKey, shouldRemoveDraft, shouldSaveDraft, type DraftSnapshot } from '../utils/draftSnapshot'
import { AUTO_SAVE_DELAY_MS, getDraftStatusText } from '../utils/draftStatus'
import { useDeleteDraft, useSaveDraft } from './drafts'

interface DraftAutosaveOptions {
  // The draft found when the form opened, or null. The member chooses to restore it or to drop it.
  draft: Draft | null
  // The topic that is edited, or null for a new topic.
  editingId: string | null
  // What the form holds now, as it would be saved.
  snapshot: DraftSnapshot
  // True while nothing must be saved (the topic is being saved, or was just saved).
  isPaused: boolean
  // Puts the values of the found draft back into the form.
  onRestore: (draft: Draft) => void
}

// The automatic draft of the write form: it is saved by itself 3 seconds after the member stops typing, removed when
// the form goes back to how it opened, and the page asks before closing while text is not saved yet.
export const useDraftAutosave = ({ draft, editingId, snapshot, isPaused, onRestore }: DraftAutosaveOptions) => {
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(draft)
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({ kind: 'idle' })
  const { mutate: saveDraftNow, isPending: isSavingDraft } = useSaveDraft(editingId)
  const { mutate: removeDraftNow, isPending: isRemovingDraft } = useDeleteDraft(editingId)

  // The state of the form when it opened: the saved topic, or an empty form. It has nothing to save.
  const [baselineKey] = useState(() => getSnapshotKey(snapshot))
  const [lastSavedKey, setLastSavedKey] = useState(baselineKey)
  const [lastFailedKey, setLastFailedKey] = useState<string | null>(null)
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const debouncedSnapshot = useDebounce(snapshot, AUTO_SAVE_DELAY_MS)
  // Nothing is saved while the member still has to choose about the draft that was found, or while it is paused.
  const canAutoSave = pendingDraft === null && !isPaused
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

  const restore = () => {
    if (!pendingDraft) return
    onRestore(pendingDraft)
    setHasSavedDraft(true)
    setLastSavedKey('')
    setPendingDraft(null)
  }

  const discard = () => {
    removeDraftNow()
    setPendingDraft(null)
  }

  // The API removes the draft when it saves the topic, so there is nothing left to save.
  const forgetAfterTopicSaved = () => {
    setHasSavedDraft(false)
    setLastSavedKey(baselineKey)
    setDraftStatus({ kind: 'idle' })
  }

  return {
    pendingDraft,
    statusText: getDraftStatusText(isSavingDraft ? { kind: 'saving' } : draftStatus),
    restore,
    discard,
    forgetAfterTopicSaved,
  }
}
