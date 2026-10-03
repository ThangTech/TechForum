using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicBookmarkRepository(TechForumDbContext dbContext) : ITopicBookmarkRepository
{
    public Task<int> CountAsync(int topicId, CancellationToken cancellationToken) =>
        dbContext.TopicBookmarks.CountAsync(item => item.TopicId == topicId, cancellationToken);

    public Task<bool> ExistsAsync(int topicId, string userId, CancellationToken cancellationToken) =>
        dbContext.TopicBookmarks.AnyAsync(
            item => item.TopicId == topicId && item.UserId == userId,
            cancellationToken);

    public async Task AddAsync(
        int topicId,
        string userId,
        DateTimeOffset createdAtUtc,
        CancellationToken cancellationToken)
    {
        if (await ExistsAsync(topicId, userId, cancellationToken)) return;

        var bookmark = new TopicBookmark
        {
            TopicId = topicId,
            UserId = userId,
            CreatedAtUtc = createdAtUtc
        };
        dbContext.TopicBookmarks.Add(bookmark);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(bookmark).State = EntityState.Detached;
        }
    }

    public Task RemoveAsync(int topicId, string userId, CancellationToken cancellationToken) =>
        dbContext.TopicBookmarks
            .Where(item => item.TopicId == topicId && item.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task<BookmarkPage> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.TopicBookmarks
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.Topic.Status == TopicStatus.Published &&
                item.Topic.PublishedAtUtc != null &&
                !item.Topic.IsDeleted &&
                !item.Topic.IsHiddenByModerator);
        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .ThenByDescending(item => item.TopicId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(item => item.Topic).ThenInclude(topic => topic.Category)
            .Include(item => item.Topic).ThenInclude(topic => topic.Author)
            .Include(item => item.Topic).ThenInclude(topic => topic.TopicTags).ThenInclude(item => item.Tag)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
        return new BookmarkPage(items, totalItems);
    }
}
