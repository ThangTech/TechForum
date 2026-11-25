import { describe, expect, it } from 'vitest'
import { needsVerifiedMark } from '../../../../features/auth/hooks/useEmailVerification'
import type { CurrentUser } from '../../../../features/auth/types/auth'

const member = { emailVerified: false } as CurrentUser

describe('needsVerifiedMark', () => {
  it('marks the signed-in member as verified once the link worked and the session is restored', () => {
    expect(needsVerifiedMark('verified', false, member)).toBe(true)
  })

  it('waits while the session is still being restored', () => {
    expect(needsVerifiedMark('verified', true, member)).toBe(false)
  })

  it('does nothing for a guest, a failed link or a member who is already verified', () => {
    expect(needsVerifiedMark('verified', false, null)).toBe(false)
    expect(needsVerifiedMark('failed', false, member)).toBe(false)
    expect(needsVerifiedMark('verified', false, { ...member, emailVerified: true })).toBe(false)
  })
})
