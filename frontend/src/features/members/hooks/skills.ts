import { useQuery } from '@tanstack/react-query'
import { getSkillCommunity } from '../api/skills'

export const skillKeys = {
  community: (tagId: string, page: number) => ['skills', 'community', tagId, page] as const,
}

// isValidId is false when the tag id in the URL is not a positive number; no request is sent then.
export const useSkillCommunity = (tagId: string, page: number, isValidId: boolean) =>
  useQuery({
    queryKey: skillKeys.community(tagId, page),
    queryFn: ({ signal }) => getSkillCommunity(tagId, page, signal),
    enabled: isValidId,
  })
