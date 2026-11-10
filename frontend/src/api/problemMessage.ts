// The sentence that a member reads when the API refuses a request. The API answers with a "problem" (title, detail and the
// errors of each field). ASP.NET writes some of these in English ("One or more validation errors occurred.", "Bad Request");
// those are never shown: the first Vietnamese sentence is used, then a sentence for the status code.

export interface ProblemLike {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

// The titles that ASP.NET gives by itself when nobody wrote another one.
const englishDefaultTitles = new Set([
  'One or more validation errors occurred.',
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Method Not Allowed',
  'Not Acceptable',
  'Conflict',
  'Unsupported Media Type',
  'Unprocessable Entity',
  'Too Many Requests',
  'Internal Server Error',
  'Bad Gateway',
  'Service Unavailable',
  'Gateway Timeout',
])

// The messages that the framework writes for a field ("The Title field is required.", "The JSON value could not be converted...").
const frameworkMessagePattern = /^(The .+ field|The JSON value|A non-empty request body|The request field|The value '|Unexpected character|Failed to read)/

const statusMessages: Record<number, string> = {
  400: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy nội dung.',
  405: 'Thao tác này không được hỗ trợ.',
  409: 'Dữ liệu bị xung đột. Vui lòng tải lại trang rồi thử lại.',
  413: 'Dữ liệu gửi lên quá lớn.',
  415: 'Định dạng dữ liệu gửi lên không được hỗ trợ.',
  422: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
  429: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
  500: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
  502: 'Máy chủ chưa phản hồi. Vui lòng thử lại sau.',
  503: 'Máy chủ đang bận. Vui lòng thử lại sau.',
  504: 'Máy chủ phản hồi quá chậm. Vui lòng thử lại sau.',
}

const isUsable = (text: string | undefined): text is string => {
  const value = text?.trim()
  return Boolean(value) && !englishDefaultTitles.has(value as string) && !frameworkMessagePattern.test(value as string)
}

export const getFirstFieldError = (errors: Record<string, string[]> | undefined): string | undefined =>
  Object.values(errors ?? {}).flat().find((message) => isUsable(message))

export const getProblemMessage = (problem: ProblemLike | null | undefined, status: number): string => {
  if (isUsable(problem?.detail)) return problem.detail.trim()
  const fieldError = getFirstFieldError(problem?.errors)
  if (fieldError) return fieldError.trim()
  if (isUsable(problem?.title)) return problem.title.trim()
  return statusMessages[status] ?? `API trả về mã lỗi ${status}.`
}
