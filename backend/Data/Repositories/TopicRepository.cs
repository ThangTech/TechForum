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

        if (string.Equals(query.Sort, "discussion", StringComparison.OrdinalIgnoreCase))
        {
            topics = topics.Where(topic => topic.Answers.Any(answer =>
                !answer.IsDeleted && !answer.IsHiddenByModerator));
        }

        var totalItems = await topics.CountAsync(cancellationToken);
        var orderedTopics = string.Equals(query.Sort, "discussion", StringComparison.OrdinalIgnoreCase)
            ? topics.OrderByDescending(topic => topic.Answers
                    .Where(answer => !answer.IsDeleted && !answer.IsHiddenByModerator)
                    .Max(answer => answer.UpdatedAtUtc ?? answer.CreatedAtUtc))
                .ThenByDescending(topic => topic.Id)
            : topics.OrderByDescending(topic => topic.IsPinned)
                .ThenByDescending(topic => topic.PublishedAtUtc)
                .ThenByDescending(topic => topic.Id);
        var items = await orderedTopics
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

    public async Task<TopicPage> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var topics = dbContext.Topics
            .AsNoTracking()
            .Where(topic => topic.AuthorId == authorId && !topic.IsDeleted);
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
        dbContext.Answers.AnyAsync(answer =>
            answer.TopicId == topicId &&
            !answer.IsDeleted &&
            !answer.IsHiddenByModerator,
            cancellationToken);

    public async Task AddAsync(Topic topic, CancellationToken cancellationToken)
    {
        dbContext.Topics.Add(topic);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    private IQueryable<Topic> PublicTopics() => dbContext.Topics
        .AsNoTracking()
        .Where(topic =>
            topic.Status == TopicStatus.Published &&
            topic.PublishedAtUtc != null &&
            !topic.IsDeleted &&
            !topic.IsHiddenByModerator);
}
