using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TopicSearchBackfillRepository : ITopicSearchBackfillRepository
{
    private readonly TechForumDbContext dbContext;

    public TopicSearchBackfillRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Topic>> GetWithoutSearchTextAsync(int count, CancellationToken cancellationToken)
    {
        return await dbContext.Topics
            .Where(topic => topic.SearchText == string.Empty)
            .OrderBy(topic => topic.CreatedAtUtc)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
