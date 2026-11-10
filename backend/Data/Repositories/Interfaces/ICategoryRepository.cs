using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken);

    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<CategoryAdminData>> GetAdminAsync(CancellationToken cancellationToken);
    Task<Category?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<int> GetTopicCountAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> SlugExistsAsync(string slug, Guid? exceptId, CancellationToken cancellationToken);
    Task<bool> AddAsync(Category category, CancellationToken cancellationToken);
    Task<bool> SaveChangesAsync(CancellationToken cancellationToken);
}
