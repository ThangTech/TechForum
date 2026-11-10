using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicRepository(TechForumDbContext dbContext, TimeProvider timeProvider) : ITopicRepository
{
    public Task<TopicPage> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken) =>
        GetFeedPageAsync(query, null, cancellationToken);

    public Task<TopicPage> GetFollowingPageAsync(
        string followerId,
        TopicQuery query,
        CancellationToken cancellationToken) =>
        GetFeedPageAsync(query, followerId, cancellationToken);

    private async Task<TopicPage> GetFeedPageAsync(
        TopicQuery query,
        string? followerId,
        CancellationToken cancellationToken)
    {
        var topics = ApplyQuestionStatus(PublicTopics(), query.QuestionStatus);
        var keyword = query.Keyword?.Trim();

        if (followerId is not null)
        {
            topics = topics.Where(topic => dbContext.UserFollows.Any(follow =>
                follow.FollowerId == followerId && follow.FollowingId == topic.AuthorId));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            topics = topics.Where(topic =>
                topic.Title.Contains(keyword) || topic.Summary.Contains(keyword));
        }

        if (query.Type.HasValue)
        {
            topics = topics.Where(topic => topic.Type == query.Type.Value);
        }

        if (query.CategoryId.HasValue)
        {
            topics = topics.Where(topic => topic.CategoryId == query.CategoryId.Value);
        }

        if (query.TagId.HasValue)
        {
            topics = topics.Where(topic => topic.TopicTags.Any(item => item.TagId == query.TagId.Value));
        }

        if (string.Equals(query.Sort, "discussion", StringComparison.OrdinalIgnoreCase))
        {
            topics = topics.Where(topic => topic.Answers.AsQueryable().Any(AnswerVisibility.IsPublic));
        }

        IQueryable<Topic> orderedTopics;
        if (string.Equals(query.Sort, "weekly", StringComparison.OrdinalIgnoreCase))
        {
            var now = timeProvider.GetUtcNow();
            var since = now.AddDays(-7);
            // Chỉ chấm hoạt động mới của người khác; sửa trả lời không làm tăng điểm tuần.
            var ranked = topics.Select(topic => new
            {
                Topic = topic,
                Score = topic.Stars.Count(star => star.UserId != topic.AuthorId &&
                    star.CreatedAtUtc >= since && star.CreatedAtUtc <= now) * 2 +
                    topic.Bookmarks.Count(bookmark => bookmark.UserId != topic.AuthorId &&
                        bookmark.CreatedAtUtc >= since && bookmark.CreatedAtUtc <= now) * 2 +
                    topic.Answers.Count(answer => answer.AuthorId != topic.AuthorId &&
                        answer.ParentAnswerId == null && !answer.IsDeleted && !answer.IsHiddenByModerator &&
                        answer.CreatedAtUtc >= since && answer.CreatedAtUtc <= now) * 3
            });
            topics = ranked.Where(item => item.Score > 0).Select(item => item.Topic);
            orderedTopics = ranked.Where(item => item.Score > 0)
                .OrderByDescending(item => item.Score)
                .ThenByDescending(item => item.Topic.PublishedAtUtc)
                .ThenByDescending(item => item.Topic.Id)
                .Select(item => item.Topic);
        }
        else if (string.Equals(query.Sort, "hot", StringComparison.OrdinalIgnoreCase))
        {
            // "Hot": the votes of a post divided by its age, so a post with many votes in a short time is on top and then
            // goes down as it gets older (the formula of Hacker News: score / (hours + 2) ^ 1.5). A new post has its score
            // hidden, so it counts as 0 for the first hours. Posts without votes follow, the newest first.
            var now = timeProvider.GetUtcNow();
            var hiddenSince = now.AddHours(-ReputationRules.ScoreHiddenHours);
            orderedTopics = topics
                .OrderByDescending(topic => (topic.PublishedAtUtc <= hiddenSince && topic.Score > 0 ? (double)topic.Score : 0.0) /
                    Math.Pow((EF.Functions.DateDiffMinute(topic.PublishedAtUtc, now) ?? 0) / 60.0 + 2.0, 1.5))
                .ThenByDescending(topic => topic.PublishedAtUtc)
                .ThenByDescending(topic => topic.Id);
        }
        else if (string.Equals(query.Sort, "top", StringComparison.OrdinalIgnoreCase))
        {
            // "Top": the highest score, of the posts of the chosen time (today, this week, this month or all). The score of
            // a new post is hidden, so it counts as 0 for the first hours.
            var now = timeProvider.GetUtcNow();
            var hiddenSince = now.AddHours(-ReputationRules.ScoreHiddenHours);
            var since = GetTopSince(query.Range, now);
            if (since is not null)
            {
                topics = topics.Where(topic => topic.PublishedAtUtc >= since);
            }
            orderedTopics = topics
                .OrderByDescending(topic => topic.PublishedAtUtc <= hiddenSince ? topic.Score : 0)
                .ThenByDescending(topic => topic.PublishedAtUtc)
                .ThenByDescending(topic => topic.Id);
        }
        else if (string.Equals(query.Sort, "discussion", StringComparison.OrdinalIgnoreCase))
        {
            orderedTopics = topics.OrderByDescending(topic => topic.Answers
                    .AsQueryable()
                    .Where(AnswerVisibility.IsPublic)
                    .Max(answer => answer.UpdatedAtUtc ?? answer.CreatedAtUtc))
                .ThenByDescending(topic => topic.Id);
        }
        else
        {
            orderedTopics = topics.OrderByDescending(topic => topic.IsPinned)
                .ThenByDescending(topic => topic.PublishedAtUtc)
                .ThenByDescending(topic => topic.Id);
        }
        var totalItems = await topics.CountAsync(cancellationToken);
        var items = await orderedTopics
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .Include(topic => topic.TopicTags)
                .ThenInclude(item => item.Tag)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var topicIds = items.Select(topic => topic.Id).ToArray();
        // Chỉ tổng hợp cho trang hiện tại, không tải toàn bộ nội dung câu trả lời.
        var discussions = await PublicTopics()
            .Where(topic => topicIds.Contains(topic.Id))
            .Select(topic => new
            {
                topic.Id,
                Summary = new TopicDiscussionDto(
                    topic.Answers.AsQueryable().Count(AnswerVisibility.IsPublic),
                    topic.Type == TopicType.Question && topic.Answers.Any(answer =>
                        answer.Id == topic.AcceptedAnswerId && answer.ParentAnswerId == null &&
                        !answer.IsDeleted && !answer.IsHiddenByModerator),
                    topic.Answers
                        .AsQueryable()
                        .Where(AnswerVisibility.IsPublic)
                        .Max(answer => (DateTimeOffset?)(answer.UpdatedAtUtc ?? answer.CreatedAtUtc)),
                    topic.Stars.Count,
                    topic.Bookmarks.Count)
            })
            .ToDictionaryAsync(item => item.Id, item => item.Summary, cancellationToken);

        return new TopicPage(items, totalItems, discussions);
    }

    // The oldest time of a post in "Top": a day, a week or a month back; null (every time) for anything else.
    public static DateTimeOffset? GetTopSince(string? range, DateTimeOffset now) => range?.ToLowerInvariant() switch
    {
        "day" => now.AddDays(-1),
        "week" => now.AddDays(-7),
        "month" => now.AddDays(-30),
        _ => null
    };

    public async Task<TopicPage> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var topics = ApplyQuestionStatus(dbContext.Topics
            .AsNoTracking()
            .Where(topic => topic.AuthorId == authorId && !topic.IsDeleted), query.QuestionStatus);
        var keyword = query.Keyword?.Trim();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            topics = topics.Where(topic =>
                topic.Title.Contains(keyword) || topic.Summary.Contains(keyword));
        }

        if (query.Type.HasValue)
        {
            topics = topics.Where(topic => topic.Type == query.Type.Value);
        }

        if (query.CategoryId.HasValue)
        {
            topics = topics.Where(topic => topic.CategoryId == query.CategoryId.Value);
        }

        if (query.TagId.HasValue)
        {
            topics = topics.Where(topic => topic.TopicTags.Any(item => item.TagId == query.TagId.Value));
        }

        var totalItems = await topics.CountAsync(cancellationToken);
        var items = await topics
            .OrderByDescending(topic => topic.UpdatedAtUtc ?? topic.CreatedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(topic => topic.Category)
            .Include(topic => topic.TopicTags)
                .ThenInclude(item => item.Tag)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new TopicPage(items, totalItems);
    }

    public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken)
    {
        return PublicTopics()
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
            .Include(topic => topic.TopicTags)
                .ThenInclude(item => item.Tag)
            .AsSplitQuery()
            .SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
    }

    public Task<Topic?> GetOwnedByIdAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken) =>
        dbContext.Topics
            .Include(topic => topic.Category)
            .Include(topic => topic.TopicTags)
                .ThenInclude(item => item.Tag)
            .Include(topic => topic.MediaAssets)
            .AsSplitQuery()
            .SingleOrDefaultAsync(topic =>
                topic.Id == id &&
                topic.AuthorId == authorId &&
                !topic.IsDeleted,
                cancellationToken);

    public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Categories
            .AsNoTracking()
            .SingleOrDefaultAsync(category => category.Id == id && category.IsActive, cancellationToken);

    public async Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(
        IReadOnlyCollection<int> ids,
        CancellationToken cancellationToken) =>
        await dbContext.Tags
            .AsNoTracking()
            .Where(tag => ids.Contains(tag.Id) && tag.IsActive)
            .OrderBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .ToListAsync(cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) =>
        dbContext.Topics.AnyAsync(topic => topic.Slug == slug, cancellationToken);

    public Task<bool> HasPublicAnswersAsync(int topicId, CancellationToken cancellationToken) =>
        dbContext.Answers
            .Where(answer => answer.TopicId == topicId)
            .Where(AnswerVisibility.IsPublic)
            .AnyAsync(cancellationToken);

    public async Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken)
    {
        dbContext.Topics.Add(topic);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (IsSlugConflict(exception))
        {
            return false;
        }
    }

    // 2601 and 2627 are SQL Server's "duplicate key" errors. Only the slug index is expected here.
    private static bool IsSlugConflict(DbUpdateException exception) =>
        exception.InnerException is SqlException { Number: 2601 or 2627 } sqlException &&
        sqlException.Message.Contains("IX_Topics_Slug", StringComparison.Ordinal);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    private static IQueryable<Topic> ApplyQuestionStatus(IQueryable<Topic> topics, string? status)
    {
        if (status is null)
        {
            return topics;
        }

        topics = topics.Where(topic => topic.Type == TopicType.Question);
        if (status == "unanswered")
        {
            return topics.Where(topic => !topic.Answers.Any(answer =>
                answer.ParentAnswerId == null && !answer.IsDeleted && !answer.IsHiddenByModerator));
        }

        if (status == "solved")
        {
            return topics.Where(topic => topic.Answers.Any(answer =>
                answer.Id == topic.AcceptedAnswerId && answer.ParentAnswerId == null &&
                !answer.IsDeleted && !answer.IsHiddenByModerator));
        }

        return topics.Where(topic => topic.Answers.Any(answer =>
                answer.ParentAnswerId == null && !answer.IsDeleted && !answer.IsHiddenByModerator) &&
            !topic.Answers.Any(answer => answer.Id == topic.AcceptedAnswerId &&
                answer.ParentAnswerId == null && !answer.IsDeleted && !answer.IsHiddenByModerator));
    }

    private IQueryable<Topic> PublicTopics() => dbContext.Topics
        .AsNoTracking()
        .Where(TopicVisibility.IsPublic);
}
