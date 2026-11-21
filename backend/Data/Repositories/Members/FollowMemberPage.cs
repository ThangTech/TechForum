namespace TechForum.Api.Data.Repositories;

public sealed record FollowMemberData(
    string Id,
    string DisplayName,
    string? Bio,
    int PublishedTopicCount,
    DateTimeOffset FollowedAtUtc);

public sealed record FollowMemberPage(
    IReadOnlyList<FollowMemberData> Items,
    int TotalItems);
