using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<CategoryDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
}
