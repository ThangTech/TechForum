using Microsoft.EntityFrameworkCore;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminTopicRepository(TechForumDbContext dbContext) : IAdminTopicRepository
{
    public async Task<AdminTopicPage> GetPageAsync(
        AdminTopicQuery query,
        TopicType? type,
        CancellationToken cancellationToken)
    {
        var topics = dbContext.Topics.AsNoTracking();
        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
            topics = topics.Where(topic => topic.Title.Contains(keyword) || topic.Summary.Contains(keyword));
        if (type.HasValue) topics = topics.Where(topic => topic.Type == type.Value);
        if (query.CategoryId.HasValue) topics = topics.Where(topic => topic.CategoryId == query.CategoryId.Value);
        topics = query.Visibility?.Trim().ToLowerInvariant() switch
        {
            "visible" => topics.Where(topic => topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc != null && !topic.IsDeleted && !topic.IsHiddenByModerator),
            "draft" => topics.Where(topic => topic.Status == TopicStatus.Draft && !topic.IsDeleted),
            "hidden" => topics.Where(topic => !topic.IsDeleted && topic.IsHiddenByModerator),
            "deleted" => topics.Where(topic => topic.IsDeleted),
            _ => topics
        };

        var totalItems = await topics.CountAsync(cancellationToken);
        var items = await topics
            .OrderByDescending(topic => topic.CreatedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .ToListAsync(cancellationToken);
        return new AdminTopicPage(items, totalItems);
    }

    public Task<Topic?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Topics
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);

    public Task<Category?> GetActiveCategoryAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Categories.SingleOrDefaultAsync(
            category => category.Id == id && category.IsActive,
            cancellationToken);

    public async Task<bool> SaveWithAuditAsync(AdminAuditLog auditLog, Notification? notification, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var topicId = int.Parse(auditLog.TargetId);
        // Giữ khóa cập nhật đến khi commit để hai quản trị viên không lưu đè cùng trạng thái.
        var current = await dbContext.Topics
            .FromSqlInterpolated($"SELECT * FROM [Topics] WITH (UPDLOCK) WHERE [Id] = {topicId}")
            .AsNoTracking()
            .Select(topic => new { topic.IsHiddenByModerator, topic.IsDiscussionLocked, topic.IsPinned, topic.CategoryId, topic.IsDeleted })
            .SingleOrDefaultAsync(cancellationToken);
        if (current is null) return false;
        var currentValue = $"hidden={current.IsHiddenByModerator};locked={current.IsDiscussionLocked};pinned={current.IsPinned};categoryId={current.CategoryId};deleted={current.IsDeleted}";
        if (currentValue != auditLog.PreviousValue) return false;
        dbContext.AdminAuditLogs.Add(auditLog);
        if (notification is not null) dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
