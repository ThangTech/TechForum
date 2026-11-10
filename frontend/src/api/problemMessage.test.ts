import { describe, expect, it } from 'vitest'
import { getFirstFieldError, getProblemMessage } from './problemMessage'

describe('getProblemMessage', () => {
  it('never shows the English title of a validation error: it shows the first message of a field', () => {
    const problem = {
      title: 'One or more validation errors occurred.',
      errors: { title: ['Tiêu đề phải có từ 5 đến 150 ký tự.'], summary: ['Tóm tắt quá ngắn.'] },
    }

    expect(getProblemMessage(problem, 400)).toBe('Tiêu đề phải có từ 5 đến 150 ký tự.')
  })

  it('prefers the detail of the problem', () => {
    expect(getProblemMessage({ title: 'Một tiêu đề', detail: 'Tài khoản chưa đủ lâu để bình chọn.' }, 403))
      .toBe('Tài khoản chưa đủ lâu để bình chọn.')
  })

  it('uses a Vietnamese title when the API gives one', () => {
    expect(getProblemMessage({ title: 'Từ này đã có trong danh sách' }, 409)).toBe('Từ này đã có trong danh sách')
  })

  it('skips the messages that the framework writes in English and falls back to the status', () => {
    const problem = {
      title: 'One or more validation errors occurred.',
      errors: { $: ['The JSON value could not be converted to System.Int32. Path: $.value'], title: ['The Title field is required.'] },
    }

    expect(getProblemMessage(problem, 400)).toBe('Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.')
  })

  it.each([
    [401, 'Unauthorized', 'Bạn cần đăng nhập để thực hiện thao tác này.'],
    [403, 'Forbidden', 'Bạn không có quyền thực hiện thao tác này.'],
    [404, 'Not Found', 'Không tìm thấy nội dung.'],
    [429, 'Too Many Requests', 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'],
    [500, 'Internal Server Error', 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'],
  ])('turns the default English title of status %i (%s) into Vietnamese', (status, title, expected) => {
    expect(getProblemMessage({ title }, status)).toBe(expected)
  })

  it('has a sentence when the answer is not a problem at all', () => {
    expect(getProblemMessage(null, 404)).toBe('Không tìm thấy nội dung.')
    expect(getProblemMessage(undefined, 418)).toBe('API trả về mã lỗi 418.')
  })
})

describe('getFirstFieldError', () => {
  it('gives the first usable message and ignores empty ones', () => {
    expect(getFirstFieldError({ a: ['', '  '], b: ['Lỗi ở b.'] })).toBe('Lỗi ở b.')
    expect(getFirstFieldError({})).toBeUndefined()
    expect(getFirstFieldError(undefined)).toBeUndefined()
  })
})
