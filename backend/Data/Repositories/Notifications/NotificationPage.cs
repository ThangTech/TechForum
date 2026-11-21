using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record NotificationPage(
    IReadOnlyList<Notification> Items,
    int TotalItems,
    int UnreadCount);
