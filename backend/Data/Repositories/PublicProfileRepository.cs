using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class PublicProfileRepository(TechForumDbContext dbContext) : IPublicProfileRepository
{
    public async Task<PublicProfileData?> GetByUserIdAsync(
        string userId,
        string? viewerId,
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
            .Where(topic => topic.AuthorId == userId)
            .Where(TopicVisibility.IsPublic);

        var publishedTopicCount = await topics.CountAsync(cancellationToken);
        var publicAnswerCount = await dbContext.Answers.AsNoTracking()
            .Where(AnswerVisibility.IsPublic)
            .WhereTopicIsPublic(answer => answer.Topic)
            .CountAsync(answer => answer.AuthorId == userId, cancellationToken);
        var receivedStarCount = await dbContext.TopicStars.AsNoTracking()
            .WhereTopicIsPublic(star => star.Topic)
            .CountAsync(star => star.Topic.AuthorId == userId, cancellationToken);
        var followerCount = await dbContext.UserFollows.AsNoTracking()
            .CountAsync(follow => follow.FollowingId == userId, cancellationToken);
        var followingCount = await dbContext.UserFollows.AsNoTracking()
            .CountAsync(follow => follow.FollowerId == userId, cancellationToken);
        var isFollowedByViewer = viewerId is not null && await dbContext.UserFollows.AsNoTracking()
            .AnyAsync(follow => follow.FollowerId == viewerId && follow.FollowingId == userId, cancellationToken);
        var skills = await topics
            .SelectMany(topic => topic.TopicTags)
            .Where(topicTag => topicTag.Tag.IsActive)
            .GroupBy(topicTag => new { topicTag.TagId, topicTag.Tag.Name, topicTag.Tag.Slug })
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key.Name)
            .Take(12)
            .Select(group => new ProfileSkillData(
                group.Key.TagId,
                group.Key.Name,
                group.Key.Slug,
                group.Count()))
            .ToListAsync(cancellationToken);
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

        return new PublicProfileData(
            user,
            publishedTopicCount,
            publicAnswerCount,
            receivedStarCount,
            followerCount,
            followingCount,
            isFollowedByViewer,
            skills,
            recentTopics);
    }
}
