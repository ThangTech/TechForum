using Microsoft.EntityFrameworkCore;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminTopicRepository : IAdminTopicRepository
{
    private readonly TechForumDbContext dbContext;

    public AdminTopicRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<AdminTopicPage> GetPageAsync(
        AdminTopicQuery query,
        TopicType? type,
        CancellationToken cancellationToken)
    {
        var topics = dbContext.Topics.AsNoTracking();
        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            // Tìm cả theo tác giả (tên hoặc email), vì quản trị viên thường cần xem mọi bài của một người.
            topics = topics.Where(topic => topic.Title.Contains(keyword) || topic.Summary.Contains(keyword) ||
                topic.Author.DisplayName.Contains(keyword) || (topic.Author.Email != null && topic.Author.Email.Contains(keyword)));
        }
        if (type.HasValue)
        {
            topics = topics.Where(topic => topic.Type == type.Value);
        }
        if (query.CategoryId.HasValue)
        {
            topics = topics.Where(topic => topic.CategoryId == query.CategoryId.Value);
        }
        var visibility = query.Visibility?.Trim().ToLowerInvariant();
        if (visibility == "visible")
        {
            topics = topics.Where(TopicVisibility.IsPublic);
        }
        else if (visibility == "draft")
        {
            topics = topics.Where(topic => topic.Status == TopicStatus.Draft && !topic.IsDeleted);
        }
        else if (visibility == "hidden")
        {
            topics = topics.Where(topic => !topic.IsDeleted && topic.IsHiddenByModerator);
        }
        else if (visibility == "deleted")
        {
            topics = topics.Where(topic => topic.IsDeleted);
        }
        else if (visibility == "reported")
        {
            topics = topics.Where(topic => dbContext.ContentReports.Any(report =>
                report.TopicId == topic.Id && report.Status == ReportStatus.Pending));
        }
        else if (visibility == "autohidden")
        {
            topics = topics.Where(topic => topic.AutoHiddenAtUtc != null);
        }

        var totalItems = await topics.CountAsync(cancellationToken);
        var ordered = query.Sort?.Trim().ToLowerInvariant() == "reports"
            ? topics.OrderByDescending(topic => dbContext.ContentReports.Count(report =>
                report.TopicId == topic.Id && report.Status == ReportStatus.Pending)).ThenByDescending(topic => topic.CreatedAtUtc)
            : topics.OrderByDescending(topic => topic.CreatedAtUtc);
        var items = await ordered
            .ThenByDescending(topic => topic.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .ToListAsync(cancellationToken);
        var ids = items.Select(topic => topic.Id).ToList();
        var pending = await dbContext.ContentReports.AsNoTracking()
            .Where(report => report.TopicId != null && ids.Contains(report.TopicId.Value) && report.Status == ReportStatus.Pending)
            .GroupBy(report => report.TopicId!.Value)
            .Select(group => new { group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.Key, item => item.Count, cancellationToken);
        return new AdminTopicPage(items, totalItems, pending);
    }

    public Task<Topic?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Topics
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
    }

    public Task<Category?> GetActiveCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.Categories.SingleOrDefaultAsync(
            category => category.Id == id && category.IsActive,
            cancellationToken);
    }

    public async Task<bool> SaveWithAuditAsync(AdminAuditLog auditLog, Notification? notification, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var topicId = Guid.Parse(auditLog.TargetId);
        // Giữ khóa cập nhật đến khi commit để hai quản trị viên không lưu đè cùng trạng thái.
        var current = await dbContext.Topics
            .FromSqlInterpolated($"SELECT * FROM [Topics] WITH (UPDLOCK) WHERE [Id] = {topicId}")
            .AsNoTracking()
            .Select(topic => new { topic.IsHiddenByModerator, topic.IsDiscussionLocked, topic.IsPinned, topic.CategoryId, topic.IsDeleted })
            .SingleOrDefaultAsync(cancellationToken);
        if (current is null)
        {
            return false;
        }
        var currentValue = $"hidden={current.IsHiddenByModerator};locked={current.IsDiscussionLocked};pinned={current.IsPinned};categoryId={current.CategoryId};deleted={current.IsDeleted}";
        if (currentValue != auditLog.PreviousValue)
        {
            return false;
        }
        dbContext.AdminAuditLogs.Add(auditLog);
        if (notification is not null)
        {
            dbContext.Notifications.Add(notification);
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
