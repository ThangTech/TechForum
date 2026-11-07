import { afterEach, describe, expect, it } from 'vitest'
import { openAuthDialog, useAuthDialogStore } from './authDialogStore'

afterEach(() => {
  useAuthDialogStore.getState().close()
})

describe('authDialogStore', () => {
  it('starts closed', () => {
    expect(useAuthDialogStore.getState().isOpen).toBe(false)
  })

  it('opens from anywhere with openAuthDialog and closes again', () => {
    openAuthDialog()
    expect(useAuthDialogStore.getState().isOpen).toBe(true)

    useAuthDialogStore.getState().close()
    expect(useAuthDialogStore.getState().isOpen).toBe(false)
  })

  it('stays one dialog when it is opened twice', () => {
    openAuthDialog()
    openAuthDialog()
    expect(useAuthDialogStore.getState().isOpen).toBe(true)

    useAuthDialogStore.getState().close()
    expect(useAuthDialogStore.getState().isOpen).toBe(false)
  })
})
