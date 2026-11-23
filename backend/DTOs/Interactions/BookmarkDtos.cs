namespace TechForum.Api.Dtos;

public sealed record BookmarkStatusDto(int Count, bool HasBookmark);

public sealed record SavedTopicDto(
    Guid Id,
    string Title,
    string Summary,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset PublishedAtUtc,
    DateTimeOffset SavedAtUtc);

public sealed class BookmarkQuery : PageQuery
{
    public BookmarkQuery()
    {
        PageSize = 10;
    }
}
