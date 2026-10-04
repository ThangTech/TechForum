import { describe, expect, it } from 'vitest'
import { resolveModuleDefault } from './moduleInterop'

describe('resolveModuleDefault', () => {
  it('keeps a direct component export unchanged', () => {
    const Component = () => null

    expect(resolveModuleDefault(Component)).toBe(Component)
  })

  it('unwraps CommonJS and nested default exports', () => {
    const Component = () => null

    expect(resolveModuleDefault({ default: Component })).toBe(Component)
    expect(resolveModuleDefault({ default: { default: Component } })).toBe(Component)
  })
})
