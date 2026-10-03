using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicEngagementRepository(TechForumDbContext dbContext) : ITopicEngagementRepository
{
    public async Task<TopicEngagementDto?> RecordViewAsync(
        int topicId,
        string visitorKeyHash,
        DateTimeOffset viewedAtUtc,
        CancellationToken cancellationToken)
    {
        var topic = await GetPublicTopicAsync(topicId, cancellationToken);
        if (topic is null) return null;

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var view = new TopicView
        {
            TopicId = topicId,
            VisitorKeyHash = visitorKeyHash,
            ViewedOnUtc = DateOnly.FromDateTime(viewedAtUtc.UtcDateTime),
            FirstViewedAtUtc = viewedAtUtc
        };
        dbContext.TopicViews.Add(view);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await dbContext.Topics
                .Where(item => item.Id == topicId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.ViewCount, item => item.ViewCount + 1),
                    cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            await transaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            var current = await dbContext.Topics.AsNoTracking().SingleAsync(item => item.Id == topicId, cancellationToken);
            return new TopicEngagementDto(current.ViewCount, current.ShareCount);
        }

        dbContext.ChangeTracker.Clear();
        var updated = await dbContext.Topics.AsNoTracking().SingleAsync(item => item.Id == topicId, cancellationToken);
        return new TopicEngagementDto(updated.ViewCount, updated.ShareCount);
    }

    public async Task<TopicEngagementDto?> RecordShareAsync(int topicId, CancellationToken cancellationToken)
    {
        var topic = await GetPublicTopicAsync(topicId, cancellationToken);
        if (topic is null) return null;
        await dbContext.Topics
            .Where(item => item.Id == topicId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.ShareCount, item => item.ShareCount + 1),
                cancellationToken);
        dbContext.Entry(topic).State = EntityState.Detached;
        var updated = await dbContext.Topics.AsNoTracking().SingleAsync(item => item.Id == topicId, cancellationToken);
        return new TopicEngagementDto(updated.ViewCount, updated.ShareCount);
    }

    private Task<Topic?> GetPublicTopicAsync(int topicId, CancellationToken cancellationToken) =>
        dbContext.Topics.SingleOrDefaultAsync(topic =>
            topic.Id == topicId && topic.Status == TopicStatus.Published && topic.PublishedAtUtc != null &&
            !topic.IsDeleted && !topic.IsHiddenByModerator,
            cancellationToken);
}
