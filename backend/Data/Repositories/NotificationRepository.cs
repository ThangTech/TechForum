using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class NotificationRepository(TechForumDbContext dbContext) : INotificationRepository
{
    public async Task<NotificationPage> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId);
        var totalItems = await query.CountAsync(cancellationToken);
        var unreadCount = await query.CountAsync(notification => notification.ReadAtUtc == null, cancellationToken);
        var items = await query
            .OrderByDescending(notification => notification.CreatedAtUtc)
            .ThenByDescending(notification => notification.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new NotificationPage(items, totalItems, unreadCount);
    }

    public async Task<bool> AddIfMissingAsync(Notification notification, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Notifications.AnyAsync(
            item => item.UserId == notification.UserId && item.SourceKey == notification.SourceKey,
            cancellationToken);
        if (exists) return false;
        dbContext.Notifications.Add(notification);
        return true;
    }

    public Task<Notification?> GetUnreadAsync(long id, string userId, CancellationToken cancellationToken) =>
        dbContext.Notifications.SingleOrDefaultAsync(
            notification => notification.Id == id && notification.UserId == userId && notification.ReadAtUtc == null,
            cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
