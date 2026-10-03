using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetActiveAsync(CancellationToken cancellationToken);

    Task<Tag?> GetActiveByIdAsync(int id, CancellationToken cancellationToken);
}
