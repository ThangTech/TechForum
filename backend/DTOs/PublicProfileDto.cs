namespace TechForum.Api.Dtos;

public sealed record PublicProfileDto(
    string Id,
    string DisplayName,
    DateTimeOffset JoinedAtUtc,
    int PublishedTopicCount,
    IReadOnlyList<TopicSummaryDto> RecentTopics);
