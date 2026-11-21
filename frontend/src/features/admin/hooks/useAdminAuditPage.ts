import { useState, type FormEvent } from 'react'
import { useListParams } from '../../../shared/hooks/useListParams'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { useAdministrators } from './accountQueries'
import { useAdminAuditLogs } from './overviewQueries'

const PAGE_SIZE = 15
const AUDIT_FILTER_KEYS = ['keyword', 'action', 'administratorId', 'from', 'to'] as const

// The dates come as yyyy-mm-dd, so comparing the text is the same as comparing the days.
export const getDateRangeError = (from: string | null, to: string | null): string | null =>
  from && to && from > to ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.' : null

// Everything the page of the admin log does: the filters (with a check of the dates) and the list.
export const useAdminAuditPage = () => {
  const list = useListParams()
  const filters = {
    keyword: list.params.get('keyword') ?? '',
    action: list.params.get('action') ?? '',
    administratorId: list.params.get('administratorId') ?? '',
    from: list.params.get('from') ?? '',
    to: list.params.get('to') ?? '',
  }
  const [validationError, setValidationError] = useState<string | null>(null)

  const administratorsQuery = useAdministrators()
  const auditQuery = useAdminAuditLogs({ page: list.page, pageSize: PAGE_SIZE, ...filters })

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    const next = list.readForm(event, AUDIT_FILTER_KEYS)
    const dateError = getDateRangeError(next.get('from'), next.get('to'))
    setValidationError(dateError)
    if (!dateError) list.apply(next)
  }

  const clearFilters = () => {
    list.clear()
    setValidationError(null)
  }

  const retry = () => {
    if (administratorsQuery.error) void administratorsQuery.refetch()
    void auditQuery.refetch()
  }

  return {
    filters,
    administrators: administratorsQuery.data ?? [],
    // The list of administrators is only a help for the filter; the log still works without it.
    administratorError: administratorsQuery.error
      ? 'Không thể tải bộ lọc quản trị viên. Bạn vẫn có thể tìm theo tên trong ô tìm kiếm.'
      : null,
    validationError,
    submitFilters,
    clearFilters,
    changePage: list.changePage,
    data: auditQuery.data ?? null,
    isLoading: isInitialLoading(auditQuery),
    error: getErrorMessage(auditQuery.error, 'Không thể tải nhật ký quản trị.'),
    retry,
  }
}
