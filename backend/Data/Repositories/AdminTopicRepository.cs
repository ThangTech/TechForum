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
            "visible" => topics.Where(topic => !topic.IsDeleted && !topic.IsHiddenByModerator),
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

    public async Task SaveWithAuditAsync(AdminAuditLog auditLog, CancellationToken cancellationToken)
    {
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
