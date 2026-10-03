namespace TechForum.Api.Dtos;

public sealed record TopicCategoryDto(int Id, string Name, string Slug);
public sealed record TopicAuthorDto(string Id, string DisplayName);
public sealed record TopicTagDto(int Id, string Name, string Slug);

public sealed record TopicSummaryDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset PublishedAtUtc,
    bool IsPinned,
    bool IsDiscussionLocked,
    int ViewCount,
    int ShareCount);

public sealed record TopicDetailDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string BodyHtml,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset PublishedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    bool IsPinned,
    bool IsDiscussionLocked,
    int ViewCount,
    int ShareCount);

public sealed record TopicEngagementDto(int ViewCount, int ShareCount);
