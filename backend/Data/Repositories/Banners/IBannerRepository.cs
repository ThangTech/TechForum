using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IBannerRepository
{
    Task<IReadOnlyList<Banner>> GetShownAsync(DateTimeOffset now, CancellationToken cancellationToken);

    Task<IReadOnlyList<Banner>> GetAllAsync(CancellationToken cancellationToken);

    Task<Banner?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> ImageUrlInUseAsync(string imageUrl, Guid exceptId, CancellationToken cancellationToken);

    Task AddAsync(Banner banner, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task RemoveAsync(Banner banner, CancellationToken cancellationToken);
}
