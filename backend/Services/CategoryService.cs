using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var categories = await categoryRepository.GetAllAsync(cancellationToken);
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        return category is null ? null : MapToDto(category);
    }

    private static CategoryDto MapToDto(Category category) => new(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.DisplayOrder);
}
