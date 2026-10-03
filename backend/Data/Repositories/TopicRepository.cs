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

    public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Categories
            .AsNoTracking()
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

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

    public async Task AddAsync(Topic topic, CancellationToken cancellationToken)
    {
        dbContext.Topics.Add(topic);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Topic> PublicTopics() => dbContext.Topics
        .AsNoTracking()
        .Where(topic =>
            topic.Status == TopicStatus.Published &&
            topic.PublishedAtUtc != null &&
            !topic.IsDeleted &&
            !topic.IsHiddenByModerator);
}
