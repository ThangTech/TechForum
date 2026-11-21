import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdminBanner, deleteAdminBanner, getAdminBanners, setAdminBannerActive, updateAdminBanner, uploadAdminBannerImage } from '../api/adminBanners'
import type { AdminBanner, SaveBannerInput } from '../types/adminBanners'
import { adminKeys, useInvalidateAdminData, useAdminQueryState } from './adminKeys'
import { bannerKeys } from '../../home/hooks/banners'

// The data of the admin page "banners".
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
export const useSaveAdminBanner = (editingId: string | null) => {
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
