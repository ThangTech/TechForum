import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import { getQuestionSlices, getStatCards } from '../utils/dashboardCards'
import { daysBefore, getQuickRange, getRangeError, readDate, today } from '../utils/dashboardRange'
import { useAdminDashboard } from './overviewQueries'

// Everything the admin dashboard does: the time range (quick 7/30 days or two dates, kept in the address), the data
// of that range, and the number cards and pie built from it.
export const useAdminOverviewPage = () => {
  const [params, setParams] = useSearchParams()
  const endDate = readDate(params.get('endDate'), today())
  const startDate = readDate(params.get('startDate'), daysBefore(endDate, 29))
  const [validationError, setValidationError] = useState<string | null>(null)
  const dashboardQuery = useAdminDashboard(startDate, endDate)
  const dashboard = dashboardQuery.data ?? null

  // The last 7 or 30 days up to today.
  const setRange = (days: number) => {
    const end = today()
    setValidationError(null)
    setParams({ startDate: daysBefore(end, days - 1), endDate: end })
  }

  const applyRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const from = String(values.get('startDate'))
    const to = String(values.get('endDate'))
    const rangeError = getRangeError(from, to)
    setValidationError(rangeError)
    if (!rangeError) setParams({ startDate: from, endDate: to })
  }

  return {
    startDate,
    endDate,
    activeRange: getQuickRange(startDate, endDate, today()),
    setRange,
    applyRange,
    validationError,
    dashboard,
    stats: getStatCards(dashboard),
    questionSlices: getQuestionSlices(dashboard),
    isLoading: isInitialLoading(dashboardQuery),
    error: getErrorMessage(dashboardQuery.error, 'Không thể tải tổng quan quản trị.'),
    retry: () => void dashboardQuery.refetch(),
  }
}
