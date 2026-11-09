import { describe, expect, it } from 'vitest'
import { colorPalettes, toCssVariableName, toCssVariables } from './palettes'
import { getOppositeMode, readStoredMode, resolveMode, saveMode, THEME_STORAGE_KEY } from './themeMode'

describe('readStoredMode', () => {
  it('returns the saved mode', () => {
    expect(readStoredMode({ getItem: () => 'dark' })).toBe('dark')
    expect(readStoredMode({ getItem: () => 'light' })).toBe('light')
  })

  it('ignores anything that is not a mode', () => {
    expect(readStoredMode({ getItem: () => 'blue' })).toBeNull()
    expect(readStoredMode({ getItem: () => null })).toBeNull()
  })

  it('works without storage or when the storage throws', () => {
    expect(readStoredMode(null)).toBeNull()
    expect(readStoredMode({ getItem: () => { throw new Error('blocked') } })).toBeNull()
  })
})

describe('saveMode', () => {
  it('writes the mode under the theme key', () => {
    const saved: Record<string, string> = {}
    saveMode({ setItem: (key, value) => { saved[key] = value } }, 'dark')
    expect(saved).toEqual({ [THEME_STORAGE_KEY]: 'dark' })
  })

  it('does not fail when the storage throws', () => {
    expect(() => saveMode({ setItem: () => { throw new Error('full') } }, 'dark')).not.toThrow()
    expect(() => saveMode(null, 'dark')).not.toThrow()
  })
})

describe('resolveMode', () => {
  it('prefers the saved choice over the system', () => {
    expect(resolveMode('light', true)).toBe('light')
    expect(resolveMode('dark', false)).toBe('dark')
  })

  it('follows the system when nothing was chosen', () => {
    expect(resolveMode(null, true)).toBe('dark')
    expect(resolveMode(null, false)).toBe('light')
  })
})

describe('getOppositeMode', () => {
  it('switches between the two modes', () => {
    expect(getOppositeMode('light')).toBe('dark')
    expect(getOppositeMode('dark')).toBe('light')
  })
})

describe('colour palettes', () => {
  it('turns a token name into a CSS variable name', () => {
    expect(toCssVariableName('page')).toBe('--color-page')
    expect(toCssVariableName('primarySoft')).toBe('--color-primary-soft')
    expect(toCssVariableName('onPrimary')).toBe('--color-on-primary')
  })

  it('gives the light and the dark mode the same tokens', () => {
    expect(Object.keys(colorPalettes.dark)).toEqual(Object.keys(colorPalettes.light))
  })

  it('makes one CSS variable for every token', () => {
    const variables = toCssVariables(colorPalettes.dark)
    expect(Object.keys(variables)).toHaveLength(Object.keys(colorPalettes.dark).length)
    expect(variables['--color-surface']).toBe(colorPalettes.dark.surface)
  })
})
