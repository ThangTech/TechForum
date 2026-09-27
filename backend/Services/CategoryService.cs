using Microsoft.EntityFrameworkCore;
using TechForum.Api.Data;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class CategoryService(TechForumDbContext dbContext) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name)
            .ThenBy(category => category.Id)
            .Select(category => new CategoryDto(
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.DisplayOrder))
            .ToListAsync(cancellationToken);
    }

    public Task<CategoryDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.Categories
            .AsNoTracking()
            .Where(category => category.Id == id)
            .Select(category => new CategoryDto(
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.DisplayOrder))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
