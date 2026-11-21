import type { ThemeMode } from './palettes'

export const THEME_STORAGE_KEY = 'techforum-theme'

export const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark'

// The mode the visitor chose before. The storage can be missing or blocked (private window), then there is no choice.
export const readStoredMode = (storage: Pick<Storage, 'getItem'> | null): ThemeMode | null => {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY)
    return isThemeMode(value) ? value : null
  } catch {
    return null
  }
}

export const saveMode = (storage: Pick<Storage, 'setItem'> | null, mode: ThemeMode): void => {
  try {
    storage?.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // The choice is only not remembered for the next visit.
  }
}

// A visitor who never chose gets the mode of the system.
export const resolveMode = (storedMode: ThemeMode | null, systemPrefersDark: boolean): ThemeMode =>
  storedMode ?? (systemPrefersDark ? 'dark' : 'light')

export const getOppositeMode = (mode: ThemeMode): ThemeMode => (mode === 'dark' ? 'light' : 'dark')
