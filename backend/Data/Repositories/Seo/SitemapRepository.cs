using Microsoft.EntityFrameworkCore;

namespace TechForum.Api.Data.Repositories;

public sealed class SitemapRepository : ISitemapRepository
{
    private readonly TechForumDbContext dbContext;

    public SitemapRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    // Chỉ bài công khai (cùng quy tắc với mọi trang công khai), mới sửa gần đây đứng trước.
    public async Task<IReadOnlyList<SitemapTopic>> GetPublicTopicsAsync(int maxCount, CancellationToken cancellationToken)
    {
        return await dbContext.Topics
            .AsNoTracking()
            .Where(TopicVisibility.IsPublic)
            .OrderByDescending(topic => topic.UpdatedAtUtc ?? topic.PublishedAtUtc ?? topic.CreatedAtUtc)
            .Take(maxCount)
            .Select(topic => new SitemapTopic(topic.Id, topic.UpdatedAtUtc ?? topic.PublishedAtUtc ?? topic.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}
