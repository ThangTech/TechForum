namespace TechForum.Api.Dtos;

public sealed record FollowMemberDto(
    string Id,
    string DisplayName,
    string? Bio,
    int PublishedTopicCount,
    DateTimeOffset FollowedAtUtc);
