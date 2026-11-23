using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminCategoryDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<Result<AdminCategoryDto>> CreateAsync(string administratorId, SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<Result<AdminCategoryDto>> UpdateAsync(string administratorId, Guid id, SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<Result<AdminCategoryDto>> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);
}
