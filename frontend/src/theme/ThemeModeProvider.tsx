import { ThemeProvider } from '@mui/material/styles'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { createAppTheme } from './appTheme'
import { colorPalettes, toCssVariables, type ThemeMode } from './palettes'
import { ThemeModeContext } from './themeModeState'
import { getOppositeMode, readStoredMode, resolveMode, saveMode } from './themeMode'

const DARK_QUERY = '(prefers-color-scheme: dark)'

const getStorage = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const systemPrefersDark = () => typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

// Writes the colours of the mode on <html>: one CSS variable per token, data-theme for CSS that needs
// to know the mode, and color-scheme so that scrollbars and form controls of the browser follow it.
const applyMode = (mode: ThemeMode) => {
  const root = document.documentElement
  Object.entries(toCssVariables(colorPalettes[mode])).forEach(([name, value]) => root.style.setProperty(name, value))
  root.dataset.theme = mode
  root.style.colorScheme = mode
}

// Keeps the light/dark choice, gives the colours to the CSS (variables) and to MUI (theme).
export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => resolveMode(readStoredMode(getStorage()), systemPrefersDark()))
  const [hasChosen, setHasChosen] = useState(() => readStoredMode(getStorage()) !== null)

  // Before the first paint, so the page never shows the wrong colours for a moment.
  useLayoutEffect(() => applyMode(mode), [mode])

  // A visitor who never chose follows the system, also when the system changes while the page is open.
  useEffect(() => {
    if (hasChosen || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia(DARK_QUERY)
    const follow = (event: MediaQueryListEvent) => setModeState(event.matches ? 'dark' : 'light')
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [hasChosen])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    setHasChosen(true)
    saveMode(getStorage(), next)
  }, [])

  const toggleMode = useCallback(() => setMode(getOppositeMode(mode)), [mode, setMode])

  const colors = colorPalettes[mode]
  const theme = useMemo(() => createAppTheme(mode, colors), [mode, colors])
  const value = useMemo(() => ({ mode, colors, setMode, toggleMode }), [mode, colors, setMode, toggleMode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
