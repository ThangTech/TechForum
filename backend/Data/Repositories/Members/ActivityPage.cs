namespace TechForum.Api.Data.Repositories;

public sealed record ActivityData(
    string Type,
    string Title,
    string Description,
    string Link,
    DateTimeOffset OccurredAtUtc);

public sealed record ActivityPage(IReadOnlyList<ActivityData> Items, int TotalItems);
