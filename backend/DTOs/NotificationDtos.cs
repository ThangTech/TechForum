namespace TechForum.Api.Dtos;

public sealed record NotificationDto(
    long Id,
    string Type,
    string Title,
    string Message,
    string Link,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ReadAtUtc);

public sealed record NotificationPageDto(
    IReadOnlyList<NotificationDto> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages,
    int UnreadCount);
