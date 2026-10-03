namespace TechForum.Api.Dtos;

public sealed record AdminTopicDto(
    int Id,
    string Title,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? PublishedAtUtc,
    bool IsDeleted,
    bool IsHiddenByModerator,
    bool IsDiscussionLocked,
    bool IsPinned);

public sealed class AdminTopicQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Keyword { get; init; }
    public string? Type { get; init; }
    public int? CategoryId { get; init; }
    public string? Visibility { get; init; }
}

public sealed record ModerateTopicRequest(
    string? Action,
    int? CategoryId,
    string? Reason);
