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
        var skills = await GetSkillsAsync(userId, topics, cancellationToken);
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

    private const int MaxSkills = 12;

    // The skills the member chose come first (in alphabetical order). The rest of the places are filled with the tags
    // that appear most often in their public content, so a member who chose nothing still has skills as before.
    private async Task<IReadOnlyList<ProfileSkillData>> GetSkillsAsync(
        string userId,
        IQueryable<Topic> topics,
        CancellationToken cancellationToken)
    {
        var chosen = await dbContext.UserSkills.AsNoTracking()
            .Where(skill => skill.UserId == userId && skill.Tag.IsActive)
            .OrderBy(skill => skill.Tag.Name)
            .ThenBy(skill => skill.TagId)
            .Select(skill => new { skill.TagId, skill.Tag.Name, skill.Tag.Slug })
            .ToListAsync(cancellationToken);
        var chosenIds = chosen.Select(skill => skill.TagId).ToList();

        var counts = await topics
            .SelectMany(topic => topic.TopicTags)
            .Where(topicTag => topicTag.Tag.IsActive)
            .GroupBy(topicTag => new { topicTag.TagId, topicTag.Tag.Name, topicTag.Tag.Slug })
            .Select(group => new ProfileSkillData(group.Key.TagId, group.Key.Name, group.Key.Slug, group.Count(), false))
            .ToListAsync(cancellationToken);
        var countByTag = counts.ToDictionary(item => item.TagId, item => item.TopicCount);

        var result = chosen
            .Select(skill => new ProfileSkillData(
                skill.TagId, skill.Name, skill.Slug, countByTag.GetValueOrDefault(skill.TagId), true))
            .ToList();
        result.AddRange(counts
            .Where(item => !chosenIds.Contains(item.TagId))
            .OrderByDescending(item => item.TopicCount)
            .ThenBy(item => item.Name)
            .Take(Math.Max(0, MaxSkills - result.Count)));
        return result;
    }
}
