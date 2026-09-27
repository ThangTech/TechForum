using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class CategoryRepository(TechForumDbContext dbContext) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name)
            .ThenBy(category => category.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.Categories
            .AsNoTracking()
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);
    }
}
