using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<CategoryDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminCategoryDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<CategoryWriteResult> CreateAsync(SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<CategoryWriteResult> UpdateAsync(int id, SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<CategoryWriteResult> SetActiveAsync(int id, bool isActive, CancellationToken cancellationToken);
}
