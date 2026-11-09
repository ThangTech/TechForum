import { createContext, useContext } from 'react'
import type { ColorTokens, ThemeMode } from './palettes'

export interface ThemeModeContextValue {
  mode: ThemeMode
  // The colours of the mode in use (the same ones that are set as CSS variables).
  colors: ColorTokens
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export const useThemeMode = (): ThemeModeContextValue => {
  const value = useContext(ThemeModeContext)
  if (!value) throw new Error('useThemeMode must be used inside ThemeModeProvider.')
  return value
}
