using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TagRepository(TechForumDbContext dbContext) : ITagRepository
{
    public async Task<IReadOnlyList<Tag>> GetActiveAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tag.IsActive)
            .OrderBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Tag?> GetActiveByIdAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.Tags
            .AsNoTracking()
            .SingleOrDefaultAsync(tag => tag.Id == id && tag.IsActive, cancellationToken);
    }
}
