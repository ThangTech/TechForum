import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  followMember,
  getFollowMembers,
  getMySkills,
  getPublicProfile,
  saveMySkills,
  unfollowMember,
  type PublicProfile,
} from '../api/profiles'
import { useUserScope, userKey } from './userScope'

export const profileKeys = {
  // The profile says whether the viewer follows this member, so it is stored per user.
  detail: (scope: string, userId: string) => userKey(scope, 'profiles', userId),
  // Lists of followers or followed members do not depend on the viewer.
  members: (userId: string) => ['profiles', 'members', userId] as const,
  membersPage: (userId: string, kind: 'followers' | 'following', page: number) =>
    [...profileKeys.members(userId), kind, page] as const,
}

// isValidId is false when the id in the URL is empty; no request is sent then.
export const usePublicProfile = (userId: string, isValidId: boolean) => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: profileKeys.detail(scope, userId),
    queryFn: ({ signal }) => getPublicProfile(userId, signal),
    enabled: isValidId && isReady,
  })
}

export const useFollowMembers = (userId: string, kind: 'followers' | 'following', page: number) =>
  useQuery({
    queryKey: profileKeys.membersPage(userId, kind, page),
    queryFn: ({ signal }) => getFollowMembers(userId, kind, page, signal),
  })

// The skills that the signed-in member chose. They belong to one account, so they are stored per user.
export const useMySkills = () => {
  const { scope, isReady } = useUserScope()

  return useQuery({
    queryKey: userKey(scope, 'profiles', 'my-skills'),
    queryFn: ({ signal }) => getMySkills(signal),
    enabled: isReady,
  })
}

export const useSaveMySkills = () => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (tagIds: number[]) => saveMySkills(tagIds),
    onSuccess: (skills) => {
      queryClient.setQueryData(userKey(scope, 'profiles', 'my-skills'), skills)
      // The public profile shows these skills too.
      void queryClient.invalidateQueries({ queryKey: userKey(scope, 'profiles') })
    },
  })
}

// Pass the current value of isFollowedByViewer: true unfollows, false follows.
export const useToggleFollow = (userId: string) => {
  const queryClient = useQueryClient()
  const { scope } = useUserScope()

  return useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? unfollowMember(userId) : followMember(userId),
    onSuccess: (status) => {
      queryClient.setQueryData<PublicProfile>(profileKeys.detail(scope, userId), (profile) =>
        profile
          ? { ...profile, isFollowedByViewer: status.isFollowing, followerCount: status.followerCount }
          : profile)
      void queryClient.invalidateQueries({ queryKey: profileKeys.members(userId) })
      // The "following" feed shows the topics of the members the user follows.
      void queryClient.invalidateQueries({ queryKey: userKey(scope, 'topics', 'following') })
    },
  })
}
