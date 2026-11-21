using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminCategoryDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<CategoryWriteResult> CreateAsync(string administratorId, SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<CategoryWriteResult> UpdateAsync(string administratorId, Guid id, SaveCategoryRequest request, CancellationToken cancellationToken);
    Task<CategoryWriteResult> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);
}
