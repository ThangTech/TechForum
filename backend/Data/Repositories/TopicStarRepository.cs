using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicStarRepository(TechForumDbContext dbContext) : ITopicStarRepository
{
    public Task<int> CountAsync(int topicId, CancellationToken cancellationToken) =>
        dbContext.TopicStars.CountAsync(star => star.TopicId == topicId, cancellationToken);

    public Task<bool> ExistsAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken) =>
        dbContext.TopicStars.AnyAsync(
            star => star.TopicId == topicId && star.UserId == userId,
            cancellationToken);

    public async Task AddAsync(
        int topicId,
        string userId,
        DateTimeOffset createdAtUtc,
        CancellationToken cancellationToken)
    {
        if (await ExistsAsync(topicId, userId, cancellationToken))
        {
            return;
        }

        var star = new TopicStar
        {
            TopicId = topicId,
            UserId = userId,
            CreatedAtUtc = createdAtUtc
        };
        dbContext.TopicStars.Add(star);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(star).State = EntityState.Detached;
        }
    }

    public async Task<StarPage> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.TopicStars
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .WhereTopicIsPublic(item => item.Topic);
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
        return new StarPage(items, totalItems);
    }

    public Task RemoveAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken) =>
        dbContext.TopicStars
            .Where(star => star.TopicId == topicId && star.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
}
