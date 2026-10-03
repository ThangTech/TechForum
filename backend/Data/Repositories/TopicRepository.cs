using Microsoft.EntityFrameworkCore;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicRepository(TechForumDbContext dbContext) : ITopicRepository
{
    public async Task<TopicPage> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var topics = PublicTopics();
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
            .OrderByDescending(topic => topic.IsPinned)
            .ThenByDescending(topic => topic.PublishedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(topic => topic.Category)
            .Include(topic => topic.Author)
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

    private IQueryable<Topic> PublicTopics() => dbContext.Topics
        .AsNoTracking()
        .Where(topic =>
            topic.Status == TopicStatus.Published &&
            topic.PublishedAtUtc != null &&
            !topic.IsDeleted &&
            !topic.IsHiddenByModerator);
}
