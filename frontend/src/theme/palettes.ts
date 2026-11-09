export type ThemeMode = 'light' | 'dark'

// Every colour of the site. Each token becomes the CSS variable "--color-<name in kebab-case>"
// (for example primarySoft -> --color-primary-soft) and also feeds the MUI theme, so a colour is
// written once per mode and used by both the CSS files and the components.
export interface ColorTokens {
  page: string // background of the whole page
  surface: string // cards, header, dialogs
  subtle: string // slightly different background inside a card
  hover: string // hover background, chips, small badges
  heading: string
  text: string
  muted: string
  quiet: string // the lightest text: dates, small counters
  border: string
  borderStrong: string
  primary: string // links, selected states, filled buttons
  primaryDark: string // hover of filled buttons, selected text
  primarySoft: string // soft blue background
  primaryBorder: string
  onPrimary: string // text on a filled primary background
  focus: string
  danger: string
  dangerSoft: string
  dangerBorder: string
  question: string
  questionSoft: string
  questionBorder: string
  solved: string
  solvedSoft: string
  solvedBorder: string
  loading: string // skeletons and empty picture frames
  pinned: string // background of a pinned topic row
  pinnedHover: string
}

export const lightColors: ColorTokens = {
  page: '#f6f8fb',
  surface: '#ffffff',
  subtle: '#f8fafc',
  hover: '#f1f5f9',
  heading: '#111827',
  text: '#263044',
  muted: '#5b6578',
  quiet: '#8a93a5',
  border: '#e4e8ef',
  borderStrong: '#cfd6e2',
  primary: '#1463d6',
  primaryDark: '#0f4fac',
  primarySoft: '#eaf2ff',
  primaryBorder: '#a9c8f5',
  onPrimary: '#ffffff',
  focus: 'rgba(20, 99, 214, 0.25)',
  danger: '#b42318',
  dangerSoft: '#fff1f0',
  dangerBorder: '#f0b8b3',
  question: '#b45309',
  questionSoft: '#fef3c7',
  questionBorder: '#fde68a',
  solved: '#15803d',
  solvedSoft: '#dcfce7',
  solvedBorder: '#bbf7d0',
  loading: '#edf0f4',
  pinned: '#f5f9ff',
  pinnedHover: '#edf4ff',
}

export const darkColors: ColorTokens = {
  page: '#0f141b',
  surface: '#171d26',
  subtle: '#1b222d',
  hover: '#232b38',
  heading: '#f3f5f9',
  text: '#d5dbe6',
  muted: '#a2adbf',
  quiet: '#7f8a9d',
  border: '#2a3342',
  borderStrong: '#3a4557',
  primary: '#5b9bf8',
  primaryDark: '#8bb8fb',
  primarySoft: '#19293f',
  primaryBorder: '#2f4f80',
  onPrimary: '#0b1220',
  focus: 'rgba(91, 155, 248, 0.4)',
  danger: '#f97066',
  dangerSoft: '#3a1b1b',
  dangerBorder: '#6b2b2b',
  question: '#f0a64a',
  questionSoft: '#35280f',
  questionBorder: '#5c4616',
  solved: '#4ade80',
  solvedSoft: '#10291d',
  solvedBorder: '#1f5a3a',
  loading: '#232b38',
  pinned: '#192334',
  pinnedHover: '#1e2a3d',
}

export const colorPalettes: Record<ThemeMode, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
}

// primarySoft -> --color-primary-soft
export const toCssVariableName = (token: string): string =>
  `--color-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`

export const toCssVariables = (colors: ColorTokens): Record<string, string> =>
  Object.fromEntries(Object.entries(colors).map(([token, value]) => [toCssVariableName(token), value]))
