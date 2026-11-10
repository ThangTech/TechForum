import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminDashboard } from './adminOverview'
import { configureApiAuth } from './client'

const guid = (number: number) => `00000000-0000-0000-0000-${String(number).padStart(12, '0')}`

const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

// What GET /api/admin/dashboard returns: ids (categories, reports, audit log) are GUID strings, the counts are numbers.
const dashboard = () => ({
  startDate: '2026-10-12',
  endDate: '2026-11-10',
  timeZone: 'Asia/Ho_Chi_Minh',
  totals: { accountCount: 12, publishedArticleCount: 3, publishedQuestionCount: 4, visibleAnswerCount: 5, pendingReportCount: 1 },
  period: { newMemberCount: 1, articleCount: 2, questionCount: 3, answerCount: 4 },
  activitySeries: [{ date: '2026-11-10', newMemberCount: 1, articleCount: 2, questionCount: 3, answerCount: 4 }],
  categories: [{ categoryId: guid(1), categoryName: 'Lập trình', articleCount: 2, questionCount: 3, topicCount: 5 }],
  questions: { totalCount: 4, unansweredCount: 1, unsolvedCount: 2, solvedCount: 1 },
  pendingReports: {
    count: 1,
    oldest: [{
      id: guid(2), targetType: 'topic', targetId: guid(3), targetTitle: 'Bài viết', reason: 'spam',
      reporter: { id: 'member', displayName: 'An' }, createdAtUtc: '2026-11-10T00:00:00Z',
    }],
  },
  recentAuditLogs: [{
    id: guid(4), administrator: { id: 'admin', displayName: 'Quản trị' }, action: 'report.resolved', targetType: 'report',
    targetId: guid(2), previousValue: null, newValue: 'accepted', reason: 'Đã xử lý', createdAtUtc: '2026-11-10T00:00:00Z',
  }],
})

afterEach(() => {
  configureApiAuth(null)
  vi.unstubAllGlobals()
})

describe('getAdminDashboard', () => {
  it('accepts GUID ids for categories, reports and the audit log', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(dashboard())))

    const result = await getAdminDashboard('2026-10-12', '2026-11-10')

    expect(result.categories[0].categoryId).toBe(guid(1))
    expect(result.pendingReports.oldest[0].id).toBe(guid(2))
  })

  it('refuses a category id that is not text', async () => {
    const data = dashboard()
    ;(data.categories[0] as Record<string, unknown>).categoryId = 1
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(data)))

    await expect(getAdminDashboard('2026-10-12', '2026-11-10')).rejects.toMatchObject({ status: 500 })
  })
})
