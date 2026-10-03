using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class PublicProfileRepository(TechForumDbContext dbContext) : IPublicProfileRepository
{
    public async Task<PublicProfileData?> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var topics = dbContext.Topics
            .AsNoTracking()
            .Where(topic =>
                topic.AuthorId == userId &&
                topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc != null &&
                !topic.IsDeleted &&
                !topic.IsHiddenByModerator);

        var publishedTopicCount = await topics.CountAsync(cancellationToken);
        var recentTopics = await topics
            .OrderByDescending(topic => topic.PublishedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Take(5)
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .Include(topic => topic.TopicTags)
                .ThenInclude(item => item.Tag)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new PublicProfileData(user, publishedTopicCount, recentTopics);
    }
}
