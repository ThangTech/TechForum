using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed record RelatedTopicData(
    int Id,
    string Title,
    string Summary,
    TopicType Type,
    int CategoryId,
    string CategoryName,
    string CategorySlug,
    string AuthorId,
    string AuthorDisplayName,
    DateTimeOffset PublishedAtUtc,
    int SharedTagCount,
    bool IsSameCategory);
