using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetActiveAsync(CancellationToken cancellationToken);

    Task<Tag?> GetActiveByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<TagAdminData>> GetAdminAsync(CancellationToken cancellationToken);
    Task<Tag?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<int> GetTopicCountAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> SlugExistsAsync(string slug, Guid? exceptId, CancellationToken cancellationToken);
    Task<bool> AddAsync(Tag tag, CancellationToken cancellationToken);
    Task<bool> SaveChangesAsync(CancellationToken cancellationToken);
}
