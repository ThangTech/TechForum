import { useQuery } from '@tanstack/react-query'
import { getBanners } from '../api/banners'

export const bannerKeys = {
  all: ['banners'] as const,
}

// The banners of the home page slider. They are public, so they do not depend on the signed-in user.
export const useBanners = () =>
  useQuery({
    queryKey: bannerKeys.all,
    queryFn: ({ signal }) => getBanners(signal),
  })
