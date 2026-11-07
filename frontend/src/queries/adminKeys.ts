import { useQueryClient } from '@tanstack/react-query'
import type { AuditFilters } from '../api/adminOverview'
import type { ReportStatus } from '../api/reports'
import type { TopicVisibility } from '../api/adminTopics'
import type { TopicType } from '../api/topics'
import { useUserScope, userKey } from './userScope'

export interface AdminAccountParams {
  keyword: string
  page: number
  pageSize: number
  status: string
  role: string
}

export interface AdminTopicParams {
  keyword: string
  type: '' | TopicType
  visibility: TopicVisibility
  categoryId?: number
  page: number
  pageSize: number
}

// All data of the administration area is stored under ['user', userId, 'admin', ...].
export const adminKeys = {
  all: (scope: string) => userKey(scope, 'admin'),
  categories: (scope: string) => [...adminKeys.all(scope), 'categories'] as const,
  tags: (scope: string) => [...adminKeys.all(scope), 'tags'] as const,
  accounts: (scope: string, params: AdminAccountParams) =>
    [...adminKeys.all(scope), 'accounts', params] as const,
  administrators: (scope: string) => [...adminKeys.all(scope), 'administrators'] as const,
  reports: (scope: string, status: ReportStatus, page: number, pageSize: number) =>
    [...adminKeys.all(scope), 'reports', { status, page, pageSize }] as const,
  topics: (scope: string, params: AdminTopicParams) =>
    [...adminKeys.all(scope), 'topics', params] as const,
  topicDetail: (scope: string, topicId: number) =>
    [...adminKeys.all(scope), 'topic', topicId] as const,
  dashboard: (scope: string, startDate: string, endDate: string) =>
    [...adminKeys.all(scope), 'dashboard', { startDate, endDate }] as const,
  audit: (scope: string, filters: AuditFilters) => [...adminKeys.all(scope), 'audit', filters] as const,
}

// An admin action can change several pages at once (the list, the audit log, the dashboard
// numbers), so after any admin action all administration data is loaded again when it is needed.
export const useInvalidateAdminData = () => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all(scope) })
}
