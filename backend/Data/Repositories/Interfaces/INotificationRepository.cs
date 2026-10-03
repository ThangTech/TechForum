using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface INotificationRepository
{
    Task<NotificationPage> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<bool> AddIfMissingAsync(Notification notification, CancellationToken cancellationToken);

    Task<Notification?> GetUnreadAsync(long id, string userId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
