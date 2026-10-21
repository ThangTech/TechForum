using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class RelatedTopicRepository(TechForumDbContext dbContext) : IRelatedTopicRepository
{
    public async Task<IReadOnlyList<RelatedTopicData>?> GetPublicRelatedAsync(
        int topicId,
        int limit,
        CancellationToken cancellationToken)
    {
        var source = await PublicTopics()
            .Where(topic => topic.Id == topicId)
            .Select(topic => new
            {
                topic.CategoryId,
                TagIds = topic.TopicTags.Select(item => item.TagId).ToArray()
            })
            .SingleOrDefaultAsync(cancellationToken);

        // Không dùng bản nháp hoặc nội dung đã bị ẩn làm nguồn gợi ý công khai.
        if (source is null) return null;

        return await PublicTopics()
            .Where(topic => topic.Id != topicId)
            .Select(topic => new
            {
                Topic = topic,
                SharedTagCount = topic.TopicTags.Count(item => source.TagIds.Contains(item.TagId)),
                IsSameCategory = topic.CategoryId == source.CategoryId
            })
            .Where(item => item.SharedTagCount > 0 || item.IsSameCategory)
            .OrderByDescending(item => item.SharedTagCount)
            .ThenByDescending(item => item.IsSameCategory)
            .ThenByDescending(item => item.Topic.PublishedAtUtc)
            .ThenByDescending(item => item.Topic.Id)
            .Take(limit)
            .Select(item => new RelatedTopicData(
                item.Topic.Id,
                item.Topic.Title,
                item.Topic.Summary,
                item.Topic.Type,
                item.Topic.CategoryId,
                item.Topic.Category.Name,
                item.Topic.Category.Slug,
                item.Topic.AuthorId,
                item.Topic.Author.DisplayName,
                item.Topic.PublishedAtUtc!.Value,
                item.SharedTagCount,
                item.IsSameCategory))
            .ToListAsync(cancellationToken);
    }

    private IQueryable<Topic> PublicTopics() => dbContext.Topics
        .AsNoTracking()
        .Where(topic => topic.Status == TopicStatus.Published &&
            topic.PublishedAtUtc != null && !topic.IsDeleted && !topic.IsHiddenByModerator);
}
