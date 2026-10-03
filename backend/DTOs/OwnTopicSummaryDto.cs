namespace TechForum.Api.Dtos;

public sealed record OwnTopicSummaryDto(
    int Id,
    string Title,
    string Summary,
    string Type,
    string Status,
    TopicCategoryDto Category,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    DateTimeOffset? PublishedAtUtc,
    bool IsHiddenByModerator,
    bool IsDiscussionLocked);
