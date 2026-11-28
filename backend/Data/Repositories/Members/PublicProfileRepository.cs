using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class PublicProfileRepository : IPublicProfileRepository
{
    private readonly TechForumDbContext dbContext;

    public PublicProfileRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

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
        var answers = dbContext.Answers.AsNoTracking()
            .Where(AnswerVisibility.IsPublic)
            .WhereTopicIsPublic(answer => answer.Topic)
            .Where(answer => answer.AuthorId == userId);
        var publicAnswerCount = await answers.CountAsync(cancellationToken);
        // Bình chọn tốt nhận được trên bài và câu trả lời còn công khai.
        var receivedUpvoteCount = await dbContext.UserVotes.AsNoTracking()
            .Where(vote => vote.Value > 0)
            .CountAsync(vote =>
                (vote.TargetType == VoteTargetType.Topic && topics.Any(topic => topic.Id == vote.TargetId)) ||
                (vote.TargetType == VoteTargetType.Answer && answers.Any(answer => answer.Id == vote.TargetId)),
                cancellationToken);
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
            receivedUpvoteCount,
            followerCount,
            followingCount,
            isFollowedByViewer,
            skills,
            recentTopics);
    }

    private const int MaxSkills = 12;

    // Kỹ năng tự chọn đứng trước; chỗ còn lại lấy các thẻ xuất hiện nhiều nhất trong nội dung công khai,
    // nên người chưa chọn gì vẫn có kỹ năng như trước.
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
