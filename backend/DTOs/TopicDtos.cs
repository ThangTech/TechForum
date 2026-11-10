namespace TechForum.Api.Dtos;

public sealed record TopicCategoryDto(int Id, string Name, string Slug);
public sealed record TopicAuthorDto(string Id, string DisplayName);
public sealed record TopicTagDto(int Id, string Name, string Slug);
public sealed record TopicDiscussionDto(
    int AnswerCount,
    bool HasAcceptedAnswer,
    DateTimeOffset? LastActivityAtUtc,
    int StarCount,
    int BookmarkCount);

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
    int ShareCount,
    TopicDiscussionDto? Discussion = null,
    string? CoverImageUrl = null,
    // The vote score (0 while it is hidden for a new post).
    int Score = 0,
    bool ScoreHidden = false);

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
    int ShareCount,
    // The vote score of the post (0 while it is hidden for a new post).
    int Score = 0,
    bool ScoreHidden = false);

public sealed record TopicEngagementDto(int ViewCount, int ShareCount);
