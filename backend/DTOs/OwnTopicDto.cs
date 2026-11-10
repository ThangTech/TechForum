namespace TechForum.Api.Dtos;

public sealed record OwnTopicDto(
    Guid Id,
    string Title,
    string Slug,
    string Summary,
    string BodyHtml,
    string Type,
    string Status,
    TopicCategoryDto Category,
    IReadOnlyList<TopicTagDto> Tags,
    IReadOnlyList<TopicMediaDto> Media,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? PublishedAtUtc);
