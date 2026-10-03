namespace TechForum.Api.Dtos;

public sealed record BookmarkStatusDto(int Count, bool HasBookmark);

public sealed record SavedTopicDto(
    int Id,
    string Title,
    string Summary,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset PublishedAtUtc,
    DateTimeOffset SavedAtUtc);

public sealed class BookmarkQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
