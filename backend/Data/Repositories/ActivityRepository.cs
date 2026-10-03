using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class ActivityRepository(TechForumDbContext dbContext) : IActivityRepository
{
    public async Task<ActivityPage> GetPublicActivityAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var topics = dbContext.Topics
            .AsNoTracking()
            .Where(topic =>
                topic.AuthorId == userId &&
                topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc != null &&
                !topic.IsDeleted &&
                !topic.IsHiddenByModerator)
            .Select(topic => new ActivityData(
                "topic-created",
                topic.Title,
                topic.Type == TopicType.Question ? "Đã đặt một câu hỏi." : "Đã đăng một bài viết.",
                "/topics/" + topic.Id,
                topic.PublishedAtUtc!.Value));

        var answers = dbContext.Answers
            .AsNoTracking()
            .Where(answer =>
                answer.AuthorId == userId &&
                !answer.IsDeleted &&
                !answer.IsHiddenByModerator &&
                answer.Topic.Status == TopicStatus.Published &&
                answer.Topic.PublishedAtUtc != null &&
                !answer.Topic.IsDeleted &&
                !answer.Topic.IsHiddenByModerator)
            .Select(answer => new ActivityData(
                "answer-created",
                answer.Topic.Title,
                "Đã trả lời một thảo luận.",
                "/topics/" + answer.TopicId + "#answer-" + answer.Id,
                answer.CreatedAtUtc));

        var activity = topics.Concat(answers);
        var totalItems = await activity.CountAsync(cancellationToken);
        var items = await activity
            .OrderByDescending(item => item.OccurredAtUtc)
            .ThenBy(item => item.Type)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new ActivityPage(items, totalItems);
    }
}
