import type { TopicSummary } from '../../topics/types/topics'

export interface PublicProfile {
  id: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  joinedAtUtc: string
  publishedTopicCount: number
  publicAnswerCount: number
  // Bình chọn tốt nhận được trên bài và câu trả lời công khai.
  receivedUpvoteCount: number
  followerCount: number
  followingCount: number
  isFollowedByViewer: boolean
  skills: ProfileSkill[]
  badges: ProfileBadge[]
  recentTopics: TopicSummary[]
  // The reputation points of the member (votes for their posts and answers, chosen answers).
  reputation: number
}

// isChosen: the member picked this skill; otherwise it was found from the tags of their public content.
export interface ProfileSkill { tagId: string; name: string; slug: string; topicCount: number; isChosen: boolean }

// A skill the member chose, as the personal page edits it (a tag that already exists).
export interface SkillTag { tagId: string; name: string; slug: string }

export interface ProfileBadge { code: string; name: string; description: string }

export interface FollowStatus { isFollowing: boolean; followerCount: number }

export interface FollowMember { id: string; displayName: string; bio: string | null; publishedTopicCount: number; followedAtUtc: string }

export interface FollowMemberPage { items: FollowMember[]; page: number; pageSize: number; totalItems: number; totalPages: number }
