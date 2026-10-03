namespace TechForum.Api.Dtos;

public sealed record OwnTopicDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string BodyHtml,
    string Type,
    string Status,
    TopicCategoryDto Category,
    IReadOnlyList<TopicTagDto> Tags,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? PublishedAtUtc);
