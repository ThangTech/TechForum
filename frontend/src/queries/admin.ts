import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminAccounts,
  setAccountLocked,
  type AdminAccount,
} from '../api/adminAccounts'
import {
  createAdminCategory,
  getAdminCategories,
  setAdminCategoryActive,
  updateAdminCategory,
  type AdminCategory,
  type SaveCategoryInput,
} from '../api/adminCategories'
import { getAdminAuditLogs, getAdminDashboard, type AuditFilters } from '../api/adminOverview'
import {
  createAdminTag,
  getAdminTags,
  setAdminTagActive,
  updateAdminTag,
  type AdminTag,
  type SaveTagInput,
} from '../api/adminTags'
import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminBanners,
  setAdminBannerActive,
  updateAdminBanner,
  uploadAdminBannerImage,
  type AdminBanner,
  type SaveBannerInput,
} from '../api/adminBanners'
import {
  getAdminTopicDetail,
  getAdminTopics,
  moderateTopic,
  type ModerationAction,
} from '../api/adminTopics'
import { getAdminReports, resolveReport, type ReportStatus } from '../api/reports'
import {
  adminKeys,
  useInvalidateAdminData,
  type AdminAccountParams,
  type AdminTopicParams,
} from './adminKeys'
import { bannerKeys } from './banners'
import { categoryKeys } from './categories'
import { statisticsKeys } from './statistics'
import { tagKeys } from './tags'
import { topicKeys } from './topics'
import { useUserScope } from './userScope'

// The administration pages are only opened by signed-in administrators. Their data waits for the
// session restore, like all data of one user.
const useAdminQueryState = () => {
  const { scope, isReady, isSignedIn } = useUserScope()
  return { scope, isEnabled: isReady && isSignedIn }
}

// ---------- categories ----------

export const useAdminCategories = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.categories(scope),
    queryFn: ({ signal }) => getAdminCategories(signal),
    enabled: isEnabled,
  })
}

// Creates a category, or changes it when editingId is set.
export const useSaveAdminCategory = (editingId: number | null) => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation<AdminCategory, Error, SaveCategoryInput>({
    mutationFn: (input) =>
      editingId ? updateAdminCategory(editingId, input) : createAdminCategory(input),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export const useToggleAdminCategory = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (category: AdminCategory) => setAdminCategoryActive(category.id, !category.isActive),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

// ---------- tags ----------

export const useAdminTags = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.tags(scope),
    queryFn: ({ signal }) => getAdminTags(signal),
    enabled: isEnabled,
  })
}

// Creates a tag, or changes it when editingId is set.
export const useSaveAdminTag = (editingId: number | null) => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation<AdminTag, Error, SaveTagInput>({
    mutationFn: (input) => (editingId ? updateAdminTag(editingId, input) : createAdminTag(input)),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export const useToggleAdminTag = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (tag: AdminTag) => setAdminTagActive(tag.id, !tag.isActive),
    onSuccess: () => {
      void invalidateAdminData()
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

// ---------- banners ----------

export const useAdminBanners = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.banners(scope),
    queryFn: ({ signal }) => getAdminBanners(signal),
    enabled: isEnabled,
  })
}

// A change of a banner also changes the slider of the home page.
const useRefreshBanners = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return () => {
    void invalidateAdminData()
    void queryClient.invalidateQueries({ queryKey: bannerKeys.all })
  }
}

// Creates a banner, or changes it when editingId is set.
export const useSaveAdminBanner = (editingId: number | null) => {
  const refreshBanners = useRefreshBanners()

  return useMutation<AdminBanner, Error, SaveBannerInput>({
    mutationFn: (input) => (editingId ? updateAdminBanner(editingId, input) : createAdminBanner(input)),
    onSuccess: refreshBanners,
  })
}

export const useToggleAdminBanner = () => {
  const refreshBanners = useRefreshBanners()

  return useMutation({
    mutationFn: (banner: AdminBanner) => setAdminBannerActive(banner.id, !banner.isActive),
    onSuccess: refreshBanners,
  })
}

export const useDeleteAdminBanner = () => {
  const refreshBanners = useRefreshBanners()

  return useMutation({
    mutationFn: (banner: AdminBanner) => deleteAdminBanner(banner.id),
    onSuccess: refreshBanners,
  })
}

export const useUploadAdminBannerImage = () =>
  useMutation({ mutationFn: (file: File) => uploadAdminBannerImage(file) })

// ---------- accounts ----------

export const useAdminAccounts = (params: AdminAccountParams) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.accounts(scope, params),
    queryFn: ({ signal }) =>
      getAdminAccounts(params.keyword, params.page, params.pageSize, signal, params.status, params.role),
    enabled: isEnabled,
  })
}

// Every administrator, for the filter of the audit log. It reads all pages of the list.
export const useAdministrators = () => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.administrators(scope),
    queryFn: async ({ signal }) => {
      const first = await getAdminAccounts('', 1, 50, signal, '', 'administrator')
      const administrators: AdminAccount[] = [...first.items]
      for (let nextPage = 2; nextPage <= first.totalPages; nextPage += 1) {
        const result = await getAdminAccounts('', nextPage, 50, signal, '', 'administrator')
        administrators.push(...result.items)
      }
      return administrators
    },
    enabled: isEnabled,
  })
}

export const useSetAccountLocked = () => {
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: {
      account: AdminAccount
      reason: string | null
      lockoutEndUtc: string | null
    }) => setAccountLocked(input.account.id, !input.account.isLocked, input.reason, input.lockoutEndUtc),
    onSuccess: () => invalidateAdminData(),
  })
}

// ---------- reports ----------

export const useAdminReports = (status: ReportStatus, page: number, pageSize: number) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.reports(scope, status, page, pageSize),
    queryFn: ({ signal }) => getAdminReports(status, page, pageSize, signal),
    enabled: isEnabled,
  })
}

export const useResolveReport = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: { reportId: number; decision: 'accepted' | 'rejected'; note: string }) =>
      resolveReport(input.reportId, input.decision, input.note),
    onSuccess: () => {
      void invalidateAdminData()
      // An accepted report can hide a topic or an answer, so public data changes too.
      void queryClient.invalidateQueries({ queryKey: topicKeys.all })
    },
  })
}

// ---------- topics ----------

export const useAdminTopics = (params: AdminTopicParams) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.topics(scope, params),
    queryFn: ({ signal }) => getAdminTopics(params, signal),
    enabled: isEnabled,
  })
}

export const useAdminTopicDetail = (topicId: number) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.topicDetail(scope, topicId),
    queryFn: ({ signal }) => getAdminTopicDetail(topicId, signal),
    enabled: isEnabled,
  })
}

export const useModerateTopic = () => {
  const queryClient = useQueryClient()
  const invalidateAdminData = useInvalidateAdminData()

  return useMutation({
    mutationFn: (input: {
      topicId: number
      action: ModerationAction
      reason: string
      categoryId?: number
    }) => moderateTopic(input.topicId, input.action, input.reason, input.categoryId),
    onSuccess: () => {
      void invalidateAdminData()
      // Hiding, locking, pinning or moving a topic changes what everyone sees.
      void queryClient.invalidateQueries({ queryKey: topicKeys.all })
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all })
    },
  })
}

// ---------- dashboard and audit log ----------

export const useAdminDashboard = (startDate: string, endDate: string) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.dashboard(scope, startDate, endDate),
    queryFn: ({ signal }) => getAdminDashboard(startDate, endDate, signal),
    enabled: isEnabled,
  })
}

export const useAdminAuditLogs = (filters: AuditFilters) => {
  const { scope, isEnabled } = useAdminQueryState()

  return useQuery({
    queryKey: adminKeys.audit(scope, filters),
    queryFn: ({ signal }) => getAdminAuditLogs(filters, signal),
    enabled: isEnabled,
  })
}
