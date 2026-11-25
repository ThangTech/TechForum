using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ITopicSearchBackfillRepository
{
    Task<IReadOnlyList<Topic>> GetWithoutSearchTextAsync(int count, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
