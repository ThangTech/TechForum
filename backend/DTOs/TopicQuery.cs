using TechForum.Api.Enums;

namespace TechForum.Api.Dtos;

public sealed class TopicQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? Keyword { get; init; }
    public TopicType? Type { get; init; }
    public int? CategoryId { get; init; }
    public int? TagId { get; init; }
    public string? Sort { get; init; }
}
