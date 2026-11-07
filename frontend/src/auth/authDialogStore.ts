import { create } from 'zustand'

interface AuthDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

// One "please log in" dialog for the whole app. Any component can open it, for example when a
// guest presses a button that needs an account, or when the API answers 401 to a signed-in action.
export const useAuthDialogStore = create<AuthDialogState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

export const openAuthDialog = () => useAuthDialogStore.getState().open()
