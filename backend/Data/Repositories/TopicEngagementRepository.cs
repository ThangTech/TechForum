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
        var viewedOnUtc = DateOnly.FromDateTime(viewedAtUtc.UtcDateTime);
        var insertedRows = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO [TopicViews] ([TopicId], [VisitorKeyHash], [ViewedOnUtc], [FirstViewedAtUtc])
            SELECT {topicId}, {visitorKeyHash}, {viewedOnUtc}, {viewedAtUtc}
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM [TopicViews] WITH (UPDLOCK, HOLDLOCK)
                WHERE [TopicId] = {topicId}
                  AND [VisitorKeyHash] = {visitorKeyHash}
                  AND [ViewedOnUtc] = {viewedOnUtc}
            );
            """, cancellationToken);

        if (insertedRows > 0)
        {
            await dbContext.Topics
                .Where(item => item.Id == topicId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.ViewCount, item => item.ViewCount + 1),
                    cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
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
