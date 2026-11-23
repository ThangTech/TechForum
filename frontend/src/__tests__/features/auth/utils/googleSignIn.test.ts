import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GoogleIdentityApi } from '../../../../features/auth/types/google'

interface FakeScript {
  src?: string
  onload?: () => void
  onerror?: () => void
}

const fakeGoogle: GoogleIdentityApi = { initialize: vi.fn(), renderButton: vi.fn() }
let fakeWindow: { google?: { accounts: { id: GoogleIdentityApi } } }
let scripts: FakeScript[]

// Test chạy trong môi trường node (không có trình duyệt), nên window và document được giả lập.
beforeEach(() => {
  fakeWindow = {}
  scripts = []
  vi.stubGlobal('window', fakeWindow)
  vi.stubGlobal('document', {
    createElement: () => ({}),
    head: { appendChild: (script: FakeScript) => scripts.push(script) },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Module giữ trạng thái "đang tải" trong biến, nên mỗi test nạp một bản mới.
const loadModule = async () => {
  vi.resetModules()
  return import('../../../../features/auth/utils/googleSignIn')
}

describe('loadGoogleIdentity', () => {
  it('uses the library at once when the page already has it', async () => {
    fakeWindow.google = { accounts: { id: fakeGoogle } }
    const { loadGoogleIdentity } = await loadModule()

    await expect(loadGoogleIdentity()).resolves.toBe(fakeGoogle)
    expect(scripts).toHaveLength(0)
  })

  it('adds the script of Google only once, even when two pages ask for it', async () => {
    const { loadGoogleIdentity } = await loadModule()

    const first = loadGoogleIdentity()
    const second = loadGoogleIdentity()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe('https://accounts.google.com/gsi/client')

    fakeWindow.google = { accounts: { id: fakeGoogle } }
    scripts[0].onload?.()

    await expect(first).resolves.toBe(fakeGoogle)
    await expect(second).resolves.toBe(fakeGoogle)
  })

  it('can try again after the script failed to load', async () => {
    const { loadGoogleIdentity } = await loadModule()

    const failed = loadGoogleIdentity()
    scripts[0].onerror?.()
    await expect(failed).rejects.toThrow()

    void loadGoogleIdentity().catch(() => undefined)
    expect(scripts).toHaveLength(2)
  })
})
