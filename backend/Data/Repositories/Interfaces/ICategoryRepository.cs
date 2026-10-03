using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken);

    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken);
}
