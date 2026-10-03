using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class CategoryRepository(TechForumDbContext dbContext) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name)
            .ThenBy(category => category.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.Categories
            .AsNoTracking()
            .SingleOrDefaultAsync(category => category.Id == id && category.IsActive, cancellationToken);
    }

    public async Task<IReadOnlyList<CategoryAdminData>> GetAdminAsync(CancellationToken cancellationToken) =>
        await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name)
            .ThenBy(category => category.Id)
            .Select(category => new CategoryAdminData(
                category,
                dbContext.Topics.Count(topic => topic.CategoryId == category.Id)))
            .ToListAsync(cancellationToken);

    public Task<Category?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Categories.SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

    public Task<int> GetTopicCountAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Topics.CountAsync(topic => topic.CategoryId == id, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.Categories.AnyAsync(
            category => category.Slug == slug && (!exceptId.HasValue || category.Id != exceptId.Value),
            cancellationToken);

    public async Task<bool> AddAsync(Category category, CancellationToken cancellationToken)
    {
        dbContext.Categories.Add(category);
        return await TrySaveAsync(category, cancellationToken);
    }

    public Task<bool> SaveChangesAsync(CancellationToken cancellationToken) =>
        TrySaveAsync(null, cancellationToken);

    private async Task<bool> TrySaveAsync(Category? addedCategory, CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            if (addedCategory is not null) dbContext.Entry(addedCategory).State = EntityState.Detached;
            return false;
        }
    }
}
