using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IBannerRepository
{
    // Active banners whose time window contains `now`, in display order.
    Task<IReadOnlyList<Banner>> GetShownAsync(DateTimeOffset now, CancellationToken cancellationToken);

    Task<IReadOnlyList<Banner>> GetAllAsync(CancellationToken cancellationToken);

    Task<Banner?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken);

    // True when another banner (not `exceptId`) uses the same picture address.
    Task<bool> ImageUrlInUseAsync(string imageUrl, int exceptId, CancellationToken cancellationToken);

    Task AddAsync(Banner banner, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task RemoveAsync(Banner banner, CancellationToken cancellationToken);
}
