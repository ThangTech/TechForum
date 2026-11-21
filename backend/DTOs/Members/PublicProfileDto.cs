namespace TechForum.Api.Dtos;

public sealed record PublicProfileDto(
    string Id,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTimeOffset JoinedAtUtc,
    int PublishedTopicCount,
    int PublicAnswerCount,
    int ReceivedStarCount,
    int FollowerCount,
    int FollowingCount,
    bool IsFollowedByViewer,
    IReadOnlyList<ProfileSkillDto> Skills,
    IReadOnlyList<ProfileBadgeDto> Badges,
    IReadOnlyList<TopicSummaryDto> RecentTopics,
    // The reputation points of the member (see ReputationRules).
    int Reputation = 0);

public sealed record ProfileSkillDto(Guid TagId, string Name, string Slug, int TopicCount, bool IsChosen);

public sealed record ProfileBadgeDto(string Code, string Name, string Description);

public sealed record FollowStatusDto(bool IsFollowing, int FollowerCount);
