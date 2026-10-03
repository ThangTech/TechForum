namespace TechForum.Api.Dtos;

public sealed record ActivityItemDto(
    string Type,
    string Title,
    string Description,
    string Link,
    DateTimeOffset OccurredAtUtc);
