namespace TechForum.Api.Dtos;

public sealed record PublicProfileDto(
    string Id,
    string DisplayName,
    DateTimeOffset JoinedAtUtc,
    int PublishedTopicCount,
    int PublicAnswerCount,
    int ReceivedStarCount,
    int FollowerCount,
    int FollowingCount,
    bool IsFollowedByViewer,
    IReadOnlyList<ProfileSkillDto> Skills,
    IReadOnlyList<ProfileBadgeDto> Badges,
    IReadOnlyList<TopicSummaryDto> RecentTopics);

public sealed record ProfileSkillDto(int TagId, string Name, string Slug, int TopicCount);

public sealed record ProfileBadgeDto(string Code, string Name, string Description);

public sealed record FollowStatusDto(bool IsFollowing, int FollowerCount);
