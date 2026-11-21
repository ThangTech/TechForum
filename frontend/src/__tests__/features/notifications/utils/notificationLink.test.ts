import { describe, expect, it } from 'vitest'
import { safeNotificationLink } from '../../../../features/notifications/utils/notificationLink'

const topic = '0f8fad5b-d9cb-469f-a165-70867728950e'
const answer = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

describe('safeNotificationLink', () => {
  it('follows the links that notifications carry', () => {
    expect(safeNotificationLink(`/topics/${topic}`)).toBe(`/topics/${topic}`)
    expect(safeNotificationLink(`/topics/${topic}#answer-${answer}`)).toBe(`/topics/${topic}#answer-${answer}`)
    expect(safeNotificationLink('/reports')).toBe('/reports')
    expect(safeNotificationLink('/notifications')).toBe('/notifications')
  })

  it('opens the home page for anything else', () => {
    expect(safeNotificationLink('/topics/5')).toBe('/')
    expect(safeNotificationLink('https://example.com')).toBe('/')
    expect(safeNotificationLink('//example.com/topics')).toBe('/')
  })
})
