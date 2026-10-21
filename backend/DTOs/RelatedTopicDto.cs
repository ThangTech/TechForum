namespace TechForum.Api.Dtos;

public sealed record RelatedTopicDto(
    int Id,
    string Title,
    string Summary,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    DateTimeOffset PublishedAtUtc,
    int SharedTagCount,
    bool IsSameCategory);
