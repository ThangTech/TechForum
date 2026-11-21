import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../shared/api/client'
import { getActionError } from '../../../shared/hooks/useActionFeedback'

describe('getActionError', () => {
  it('shows the Vietnamese message of the API', () => {
    expect(getActionError(new ApiError(409, 'Đường dẫn đã được sử dụng.'), 'Không thể lưu.')).toBe('Đường dẫn đã được sử dụng.')
  })

  it('shows the given text for any other error, never an English browser message', () => {
    expect(getActionError(new TypeError('Failed to fetch'), 'Không thể lưu.')).toBe('Không thể lưu.')
    expect(getActionError('boom', 'Không thể lưu.')).toBe('Không thể lưu.')
  })
})
